const express = require('express');
const { Order, User, OrderItem, OrderLog, Notification } = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { sendPushNotification } = require('../utils/push');

const router = express.Router();

// Create Order (Maker only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!['maker', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only makers or admins can create orders' });
        }

        const { title, description, assignedTakerIds, items } = req.body;

        let defaultDesc = 'New Order';
        if (items && items.length > 0) {
            defaultDesc = 'Order with ' + items.length + ' items';
        }

        const order = await Order.create({
            title,
            description: description || defaultDesc,
            makerId: req.user.id,
            status: 'pending'
        });

        if (assignedTakerIds && assignedTakerIds.length > 0) {
            await order.setAssignedTakers(assignedTakerIds);

            // Notify Takers
            const notifications = assignedTakerIds.map(id => ({
                userId: id,
                message: 'New Order Assigned: ' + (order.title || 'Untitled Order'),
                type: 'alert',
                orderId: order.id
            }));
            await Notification.bulkCreate(notifications);

            // Send Push Notifications
            assignedTakerIds.forEach(id => {
                sendPushNotification(id, {
                    title: 'New Order Assigned',
                    body: `You have been assigned to order #${order.id}: ${order.title || 'Untitled Order'}`,
                    url: `/`
                });
            });
        }

        if (items && items.length > 0) {
            const orderItems = items.map(item => ({
                ...item,
                orderId: order.id
            }));
            await OrderItem.bulkCreate(orderItems);
        }

        // Fetch complete order with items
        const completeOrder = await Order.findByPk(order.id, {
            include: [
                { model: User, as: 'Maker', attributes: ['id', 'username', 'role'] },
                { model: User, as: 'AssignedTakers', attributes: ['id', 'username'] },
                { model: OrderItem, as: 'Items' }
            ]
        });

        res.status(201).json(completeOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Orders (For current user)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let orders;
        const includeOptions = [
            { model: User, as: 'Maker', attributes: ['id', 'username', 'role'] },
            { model: User, as: 'AssignedTakers', attributes: ['id', 'username'] },
            {
                model: OrderLog,
                as: 'History',
                include: [{ model: User, as: 'Editor', attributes: ['username'] }]
                // If you want ordered history, do it at top-level order instead of here
            },
            { model: OrderItem, as: 'Items' }
        ];

        if (req.user.role === 'maker') {
            // Makers see orders they created
            orders = await Order.findAll({
                where: { makerId: req.user.id },
                include: includeOptions,
                order: [['createdAt', 'DESC']]
            });
        } else if (req.user.role === 'admin') {
            orders = await Order.findAll({
                include: includeOptions,
                order: [['createdAt', 'DESC']]
            });
        } else {
            // Takers see orders assigned to them
            const user = await User.findByPk(req.user.id, {
                include: [{
                    model: Order,
                    as: 'AssignedOrders',
                    include: [
                        { model: User, as: 'Maker', attributes: ['id', 'username', 'role'] },
                        { model: OrderItem, as: 'Items' },
                        {
                            model: OrderLog,
                            as: 'History',
                            include: [{ model: User, as: 'Editor', attributes: ['username'] }]
                        },
                        { model: User, as: 'AssignedTakers', attributes: ['id', 'username'] }
                    ]
                }]
            });
            orders = user ? user.AssignedOrders : [];
        }

        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Order Status, Title, Description, Items, Assigned Takers
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        console.log(`PUT /api/orders/${req.params.id} hit by user: ${req.user.username} (${req.user.role})`);
        console.log('Request body:', req.body);

        const { status, title, description, items, assignedTakerIds } = req.body;

        const order = await Order.findByPk(req.params.id, {
            include: [
                { model: User, as: 'Maker', attributes: ['id', 'username', 'role'] },
                { model: OrderItem, as: 'Items' },
                { model: User, as: 'AssignedTakers', attributes: ['id', 'username'] }
            ]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const isAdmin = req.user.role === 'admin';
        const isMaker = order.makerId === req.user.id;
        const isAssigned = (order.AssignedTakers || []).some(taker => taker.id === req.user.id);

        if (!isAdmin && !isMaker && !isAssigned) {
            return res.status(403).json({ error: 'Not authorized to edit this order' });
        }

        // Handle Details Update (Title, Description, Items)
        if (title !== undefined || description !== undefined || items !== undefined || assignedTakerIds !== undefined) {
            // Log Title Change
            if (title && title !== order.title) {
                await OrderLog.create({
                    orderId: order.id,
                    previousDescription: order.title || 'None',
                    newDescription: `Title: ${order.title || 'None'} -> ${title}`,
                    changedBy: req.user.id
                });
                order.title = title;
            }

            // Log Description Change
            if (description && description !== order.description) {
                await OrderLog.create({
                    orderId: order.id,
                    previousDescription: order.description || 'None',
                    newDescription: `Desc: ${order.description || 'None'} -> ${description}`,
                    changedBy: req.user.id
                });
                order.description = description;
            }

            // Handle Items Update
            if (Array.isArray(items)) {
                const oldItems = order.Items || [];
                const newItems = items;

                const oldItemsMap = new Map(oldItems.map(i => [i.name, i.quantity]));
                const newItemsMap = new Map(newItems.map(i => [i.name, i.quantity]));

                // Check for Updates and Additions
                for (const [name, newQty] of newItemsMap) {
                    if (oldItemsMap.has(name)) {
                        const oldQty = oldItemsMap.get(name);
                        if (oldQty !== newQty) {
                            await OrderLog.create({
                                orderId: order.id,
                                previousDescription: String(oldQty),
                                newDescription: `Updated ${name}: Qty ${oldQty} -> ${newQty}`,
                                changedBy: req.user.id
                            });
                        }
                        oldItemsMap.delete(name); // processed
                    } else {
                        await OrderLog.create({
                            orderId: order.id,
                            previousDescription: 'None',
                            newDescription: `Added: ${name} (Qty: ${newQty})`,
                            changedBy: req.user.id
                        });
                    }
                }

                // Check for Removals (remaining items in oldItemsMap)
                for (const [name, oldQty] of oldItemsMap) {
                    await OrderLog.create({
                        orderId: order.id,
                        previousDescription: `${name} (${oldQty})`,
                        newDescription: `Removed: ${name}`,
                        changedBy: req.user.id
                    });
                }

                // Remove old items and create new ones
                await OrderItem.destroy({ where: { orderId: order.id } });
                const orderItems = items.map(item => ({
                    ...item,
                    orderId: order.id
                }));
                await OrderItem.bulkCreate(orderItems);
            }

            // Handle Assigned Takers Update
            if (assignedTakerIds !== undefined) {
                const currentTakerIds = (order.AssignedTakers || []).map(t => t.id);
                const newTakerIds = assignedTakerIds || [];

                const isDifferent =
                    currentTakerIds.length !== newTakerIds.length ||
                    !currentTakerIds.every(id => newTakerIds.includes(id));

                if (isDifferent) {
                    await order.setAssignedTakers(newTakerIds);

                    // Log the change
                    await OrderLog.create({
                        orderId: order.id,
                        previousDescription: 'Takers Updated',
                        newDescription: 'Updated Assigned Takers',
                        changedBy: req.user.id
                    });

                    // Notify New Takers
                    const addedTakers = newTakerIds.filter(id => !currentTakerIds.includes(id));
                    if (addedTakers.length > 0) {
                        await Notification.bulkCreate(
                            addedTakers.map(id => ({
                                userId: id,
                                message: `You have been assigned to order #${order.id}: ${order.title || 'Untitled'}`,
                                type: 'alert',
                                orderId: order.id
                            }))
                        );
                    }
                }
            }
        }

        // Handle Status Update
        if (status) {
            order.status = status;

            // If Taker updates status, notify Maker
            if (req.user.role === 'taker') {
                await Notification.create({
                    userId: order.makerId,
                    message: `Order #${order.id} status updated to '${status}' by ${req.user.username}`,
                    type: 'info',
                    orderId: order.id
                });
            }
        }

        await order.save();

        // General Notification for Edits (Title/Description/Items/Assigned Takers)
        // If Maker edits, notify ALL current takers
        if (
            req.user.role === 'maker' &&
            (req.body.title || req.body.description || req.body.items || req.body.assignedTakerIds)
        ) {
            const currentTakers = await order.getAssignedTakers();
            if (currentTakers.length > 0) {
                await Notification.bulkCreate(
                    currentTakers.map(t => ({
                        userId: t.id,
                        message: `Order #${order.id} was updated by Maker`,
                        type: 'info',
                        orderId: order.id
                    }))
                );
            }
        }

        // If Taker edits details, notify Maker
        if (
            req.user.role === 'taker' &&
            (req.body.title || req.body.description || req.body.items || req.body.assignedTakerIds)
        ) {
            await Notification.create({
                userId: order.makerId,
                message: `Order #${order.id} details updated by ${req.user.username}`,
                type: 'info',
                orderId: order.id
            });
        }

        // Reload to get full data
        const updatedOrder = await Order.findByPk(order.id, {
            include: [
                { model: User, as: 'Maker', attributes: ['id', 'username', 'role'] },
                { model: User, as: 'AssignedTakers', attributes: ['id', 'username'] },
                {
                    model: OrderLog,
                    as: 'History',
                    include: [{ model: User, as: 'Editor', attributes: ['username'] }]
                },
                { model: OrderItem, as: 'Items' }
            ]
        });

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete Order
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'maker') {
            return res.status(403).json({ error: 'Only makers can delete orders' });
        }

        const order = await Order.findByPk(req.params.id);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (order.makerId !== req.user.id) {
            return res.status(403).json({ error: 'You can only delete your own orders' });
        }

        // Delete associated items and logs first (manual cascade)
        await OrderItem.destroy({ where: { orderId: order.id } });
        await OrderLog.destroy({ where: { orderId: order.id } });

        // Delete the order
        await order.destroy();

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
