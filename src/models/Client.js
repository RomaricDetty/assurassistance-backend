const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    nomClient: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le nom du client ne peut pas être vide'
            }
        }
    },
    prenomClient: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le prénom du client ne peut pas être vide'
            }
        }
    },
    idCarteBancaire: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'L\'ID de la carte bancaire ne peut pas être vide'
            }
        }
    },
    typeContrat: {
        type: DataTypes.ENUM('Business', 'Platinum', 'Premier'),
        allowNull: false,
        validate: {
            isIn: {
                args: [['Business', 'Platinum', 'Premier']],
                msg: 'Le type de contrat doit être Business, Platinum ou Premier'
            }
        }
    }
}, {
    tableName: 'clients',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ['idCarteBancaire']
        }
    ]
});

module.exports = Client;