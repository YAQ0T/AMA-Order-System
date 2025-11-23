const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../db');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const user = await User.create({ username, password, role });
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all takers (for Makers to assign)
router.get('/takers', async (req, res) => {
    try {
        const takers = await User.findAll({
            where: { role: 'taker' },
            attributes: ['id', 'username', 'role']
        });
        res.json(takers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
