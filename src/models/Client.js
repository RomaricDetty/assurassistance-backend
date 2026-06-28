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
    typeContratId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'clients',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ['idCarteBancaire']
        },
        {
            fields: ['typeContratId']
        }
    ]
});

module.exports = Client;
