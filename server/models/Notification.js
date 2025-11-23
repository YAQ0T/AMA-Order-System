const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        message: {
            type: DataTypes.STRING,
            allowNull: false
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        type: {
            type: DataTypes.ENUM('info', 'alert', 'success'),
            defaultValue: 'info'
        },
        orderId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });

    return Notification;
};
