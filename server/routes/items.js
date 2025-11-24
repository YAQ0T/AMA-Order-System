const express = require('express');
const router = express.Router();
const { OrderItem, sequelize } = require('../db');
const { Op } = require('sequelize');

// GET /api/items/suggestions?q=query
router.get('/suggestions', async (req, res) => {
    try {
        const { q } = req.query;
        const whereClause = {};

        if (q) {
            whereClause.name = {
                [Op.iLike]: `%${q}%`
            };
        }

        // Fetch distinct product names
        // Using Sequelize aggregate to get distinct names is a bit tricky, 
        // so we'll use a simple findAll with attributes and group
        const items = await OrderItem.findAll({
            attributes: [
                [sequelize.fn('DISTINCT', sequelize.col('name')), 'name']
            ],
            where: whereClause,
            limit: 6,
            order: [['name', 'ASC']]
        });

        const suggestions = items.map(item => item.name);
        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching item suggestions:', error);
        res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
});

module.exports = router;
