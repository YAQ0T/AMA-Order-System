
const express = require('express');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./db');
const { seedAdmin } = require('./utils/seedAdmin');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Sync Database (auto-migrate schema) and seed admin
sequelize.sync({ alter: true }).then(async () => {
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
        console.log(`Also accessible at https://10.10.10.56:${PORT}`);
    });
}


