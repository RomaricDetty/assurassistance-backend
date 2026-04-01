const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle GroupeAdmin
 * Représente un groupe d'agents rattaché à un partenaire.
 */
const GroupeAdmin = sequelize.define('GroupeAdmin', {
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
                msg: 'Le nom du groupe est obligatoire'
            }
        }
    },
    partenaireId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    validFrom: {
        type: DataTypes.DATE,
        allowNull: true
    },
    validTo: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'groupes_admin',
    timestamps: true,
    paranoid: true,
    indexes: [
        { fields: ['partenaireId'] },
        { fields: ['isActive'] }
    ]
});

module.exports = GroupeAdmin;
