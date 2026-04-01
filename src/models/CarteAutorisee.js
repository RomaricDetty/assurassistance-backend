const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle CarteAutorisee
 * Représente une carte autorisée pour un groupe donné.
 */
const CarteAutorisee = sequelize.define('CarteAutorisee', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    groupeId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    numeroCarte: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le numéro de carte est obligatoire'
            }
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'cartes_autorisees',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ['groupeId', 'numeroCarte']
        },
        {
            fields: ['groupeId']
        },
        {
            fields: ['numeroCarte']
        }
    ]
});

module.exports = CarteAutorisee;
