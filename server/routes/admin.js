const express = require('express');
const { User, Order, OrderItem, OrderLog, ActivityLog } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken, requireAdmin);

// ============ USER MANAGEMENT ============

// Get all users with optional filters
router.get('/users', async (req, res) => {
    try {
        const { role, isApproved, search } = req.query;

        const where = {};
        if (role) where.role = role;
        if (isApproved !== undefined) where.isApproved = isApproved === 'true';
        if (search) {
            where.username = { [Op.like]: `%${search}%` };
        }

        const users = await User.findAll({
            where,
            attributes: ['id', 'username', 'role', 'isApproved', 'approvedBy', 'approvedAt', 'createdAt'],
            include: [{
                model: User,
                as: 'Approver',
                attributes: ['id', 'username']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get pending approval users
router.get('/users/pending', async (req, res) => {
    try {
        const users = await User.findAll({
            where: {
                isApproved: false,
                role: { [Op.ne]: 'admin' } // Exclude admin from pending
            },
            attributes: ['id', 'username', 'role', 'createdAt'],
            order: [['createdAt', 'ASC']]
        });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Approve a user
router.put('/users/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isApproved) {
            return res.status(400).json({ error: 'User is already approved' });
        }

        user.isApproved = true;
        user.approvedBy = adminId;
        user.approvedAt = new Date();
        await user.save();

        // Log the approval
        await logActivity(adminId, 'user_approved', 'user', user.id, {
            approvedUser: user.username,
            approvedRole: user.role
        }, req.ip);

        res.json({
            message: 'User approved successfully',
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        // Prevent admin from deleting themselves
        if (parseInt(id) === adminId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const deletedUserInfo = {
            username: user.username,
            role: user.role
        };

        await user.destroy();

        // Log the deletion
        await logActivity(adminId, 'user_deleted', 'user', id, deletedUserInfo, req.ip);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDER MANAGEMENT ============

// Get all orders
router.get('/orders', async (req, res) => {
    try {
        const { status, makerId } = req.query;

        const where = {};
        if (status) where.status = status;
        if (makerId) where.makerId = makerId;

        const orders = await Order.findAll({
            where,
            include: [
                {
                    model: User,
                    as: 'Maker',
                    attributes: ['id', 'username', 'role']
                },
                {
                    model: User,
                    as: 'AssignedTakers',
                    attributes: ['id', 'username'],
                    through: { attributes: [] }
                },
                {
                    model: OrderItem,
                    as: 'Items'
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific order details
router.get('/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'Maker',
                    attributes: ['id', 'username', 'role']
                },
                {
                    model: User,
                    as: 'AssignedTakers',
                    attributes: ['id', 'username'],
                    through: { attributes: [] }
                },
                {
                    model: OrderItem,
                    as: 'Items'
                }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get change logs for a specific order
router.get('/orders/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;

        const logs = await OrderLog.findAll({
            where: { orderId: id },
            include: [{ model: User, as: 'Editor', attributes: ['id', 'username'] }],
            order: [['createdAt', 'DESC']]
        });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete any order
router.delete('/orders/:id', async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        const order = await Order.findByPk(id, {
            include: [
                { model: OrderItem, as: 'Items' },
                { model: OrderLog, as: 'History' },
                { model: User, as: 'AssignedTakers' }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Remove related records first
        await OrderItem.destroy({ where: { orderId: order.id } });
        await OrderLog.destroy({ where: { orderId: order.id } });
        await order.setAssignedTakers([]);

        await order.destroy();

        await logActivity(adminId, 'order_deleted', 'order', id, {
            title: order.title,
            makerId: order.makerId,
            totalItems: order.Items?.length || 0
        }, req.ip);

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ ACTIVITY LOGS ============

// Get activity logs with filters
router.get('/logs', async (req, res) => {
    try {
        const { action, userId, startDate, endDate, limit = 100 } = req.query;

        const where = {};
        if (action) where.action = action;
        if (userId) where.userId = userId;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt[Op.gte] = new Date(startDate);
            if (endDate) where.createdAt[Op.lte] = new Date(endDate);
        }

        const logs = await ActivityLog.findAll({
            where,
            include: [{
                model: User,
                as: 'User',
                attributes: ['id', 'username', 'role']
            }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit)
        });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ DASHBOARD STATISTICS ============

// Get dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const [
            totalUsers,
            pendingApprovals,
            totalOrders,
            activeOrders,
            recentActivity
        ] = await Promise.all([
            User.count({ where: { role: { [Op.ne]: 'admin' } } }),
            User.count({ where: { isApproved: false, role: { [Op.ne]: 'admin' } } }),
            Order.count(),
            Order.count({ where: { status: { [Op.in]: ['pending', 'in-progress'] } } }),
            ActivityLog.findAll({
                limit: 10,
                order: [['createdAt', 'DESC']],
                include: [{
                    model: User,
                    as: 'User',
                    attributes: ['username']
                }]
            })
        ]);

        const usersByRole = await User.findAll({
            where: { role: { [Op.ne]: 'admin' } },
            attributes: [
                'role',
                [require('sequelize').fn('COUNT', 'id'), 'count']
            ],
            group: ['role']
        });

        res.json({
            totalUsers,
            pendingApprovals,
            totalOrders,
            activeOrders,
            usersByRole: usersByRole.reduce((acc, item) => {
                acc[item.role] = parseInt(item.get('count'));
                return acc;
            }, {}),
            recentActivity
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
