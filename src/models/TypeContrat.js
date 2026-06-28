const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Modèle TypeContrat
 * Représente un type de contrat dynamique avec son PDF associé.
 */
const TypeContrat = sequelize.define('TypeContrat', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'Le code du type de contrat est obligatoire' }
        }
    },
    libelle: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Le libellé du type de contrat est obligatoire' }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    pdfPath: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    pdfFileName: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    ordre: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
}, {
    tableName: 'types_contrat',
    timestamps: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ['code'] },
        { fields: ['isActive'] },
        { fields: ['ordre'] }
    ]
});

module.exports = TypeContrat;
