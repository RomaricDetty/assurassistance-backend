const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Table de liaison groupe ↔ types de contrat autorisés.
 * Si aucune entrée pour un groupe, tous les types actifs sont autorisés.
 */
const GroupeTypeContrat = sequelize.define('GroupeTypeContrat', {
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
    typeContratId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    tableName: 'groupe_types_contrat',
    timestamps: true,
    indexes: [
        { unique: true, fields: ['groupeId', 'typeContratId'] },
        { fields: ['groupeId'] },
        { fields: ['typeContratId'] }
    ]
});

module.exports = GroupeTypeContrat;
