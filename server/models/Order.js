const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define('Order', {
        title: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'archived'),
            defaultValue: 'pending'
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                isIn: [['نابلس', 'الخليل', 'جنين', 'طولكرم', 'بديا', 'قلقيليا', 'رامالله', 'بيت لحم', 'الداخل']]
            }
        }
    }, {
        indexes: [
            {
                fields: ['status']
            },
            {
                fields: ['city']
            },
            {
                fields: ['makerId']
            },
            {
                fields: ['createdAt']
            },
            {
                fields: ['title']
            }
        ]
    });

    return Order;
};
