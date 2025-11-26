require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { DataTypes } = require('sequelize');
const { sequelize, OrderAssignments, Order, User, OrderItem } = require('./db');
const { seedAdmin } = require('./utils/seedAdmin');

const app = express();
const PREFERRED_PORT = Number(process.env.PORT) || 3003;

const isPortAvailable = (port) => new Promise((resolve, reject) => {
    const tester = net
        .createServer()
        .once('error', (err) => {
            if (err.code === 'EADDRINUSE' || err.code === 'EACCES') {
                resolve(false);
            } else {
                reject(err);
            }
        })
        .once('listening', () => {
            tester.close(() => resolve(true));
        })
        .listen(port, '0.0.0.0');
});

const findAvailablePort = async (preferredPort, attempts = 10) => {
    for (let offset = 0; offset < attempts; offset++) {
        const portToTry = preferredPort + offset;
        const available = await isPortAvailable(portToTry);

        if (available) {
            return portToTry;
        }
    }

    throw new Error(`No available ports found starting from ${preferredPort}`);
};

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:5174',
            'https://localhost:5173',
            'https://localhost:5174',
            'http://10.10.10.110:5173',
            'http://10.10.10.110:5174',
            'https://10.10.10.110:5173',
            'https://10.10.10.110:5174',
            'http://213.6.226.163:5173',
            'https://213.6.226.163:5173'
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins for now, but with credentials
        }
    },
    credentials: true
}));
app.use(express.json());

// Sync Database and seed admin
const syncDatabase = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const orderTable = await queryInterface.describeTable('Orders');

        if (!orderTable.accounterId) {
            await queryInterface.addColumn('Orders', 'accounterId', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
            console.log('Added accounterId column to Orders table');
        }

        await sequelize.sync();

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

        // Alter OrderItem table to add status column
        try {
            await OrderItem.sync({ alter: true });
            console.log('OrderItem table altered - status column added');
        } catch (err) {
            console.error('Error altering OrderItem table:', err);
        }

        console.log('Database synced');
        await seedAdmin();
    } catch (error) {
        console.error('Failed to sync database:', error);
    }
};

syncDatabase();

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

const startServer = async () => {
    const httpsOptions = {
        key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
    };

    const portToUse = await findAvailablePort(PREFERRED_PORT);

    if (portToUse !== PREFERRED_PORT) {
        console.warn(`Port ${PREFERRED_PORT} is in use. Switching to ${portToUse}.`);
    }

    https.createServer(httpsOptions, app).listen(portToUse, '0.0.0.0', () => {
        console.log(`HTTPS Server running on https://localhost:${portToUse}`);
        console.log(`Also accessible at https://10.10.10.110:${portToUse}`);
    });
};

// Start HTTPS Server
if (require.main === module) {
    startServer().catch((error) => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}


