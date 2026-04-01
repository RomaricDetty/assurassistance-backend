const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle Partenaire
 * Représente le partenaire associé à un groupe d'agents.
 */
const Partenaire = sequelize.define('Partenaire', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    nom: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le nom du partenaire est obligatoire'
            }
        }
    },
    contact: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    adresse: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'partenaires',
    timestamps: true,
    paranoid: true
});

module.exports = Partenaire;
