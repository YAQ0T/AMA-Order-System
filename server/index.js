require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { sequelize, OrderAssignments, Order, User } = require('./db');
const { seedAdmin } = require('./utils/seedAdmin');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Sync Database and seed admin
sequelize.sync().then(async () => {
    // Alter Order table to allow null description
    try {
        await Order.sync({ alter: true });
        console.log('Order table altered');
    } catch (err) {
        console.error('Error altering Order table:', err);
    }

    // Alter User table to add email column
    try {
        await User.sync({ alter: true });
        console.log('User table altered - email column added');
    } catch (err) {
        console.error('Error altering User table:', err);
    }

    console.log('Database synced');
    await seedAdmin();
}).catch((error) => {
    console.error('Failed to sync database:', error);
});

// Routes
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/items', require('./routes/items'));

// Export for routes to use
module.exports = { app, sequelize };

// Start HTTPS Server
if (require.main === module) {
    const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
    };

    https.createServer(httpsOptions, app).listen(PORT, '0.0.0.0', () => {
        console.log(`HTTPS Server running on https://localhost:${PORT}`);
        console.log(`Also accessible at https://10.10.10.110:${PORT}`);
    });
}


