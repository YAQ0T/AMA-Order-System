const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('maker', 'taker'),
            allowNull: false
        }
    });

    User.beforeCreate(async (user) => {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
        }
    });

    return User;
};
