const sequelize = require('../config/database');
const Administrateur = require('./Administrateur');
const Client = require('./Client');
const Partenaire = require('./Partenaire');
const GroupeAdmin = require('./GroupeAdmin');
const CarteAutorisee = require('./CarteAutorisee');
const TypeContrat = require('./TypeContrat');
const GroupeTypeContrat = require('./GroupeTypeContrat');
const { DEFAULT_SUPER_ADMIN_LINKS } = require('../constants/interfaceLinks');

/**
 * Fichier central pour exporter tous les modèles
 * Les relations sont déjà définies dans chaque modèle
 */

const models = {
    Administrateur,
    Client,
    Partenaire,
    GroupeAdmin,
    CarteAutorisee,
    TypeContrat,
    GroupeTypeContrat
};

// Relations
Partenaire.hasMany(GroupeAdmin, { foreignKey: 'partenaireId', as: 'groupes' });
GroupeAdmin.belongsTo(Partenaire, { foreignKey: 'partenaireId', as: 'partenaire' });

GroupeAdmin.hasMany(Administrateur, { foreignKey: 'groupeId', as: 'administrateurs' });
Administrateur.belongsTo(GroupeAdmin, { foreignKey: 'groupeId', as: 'groupe' });

GroupeAdmin.hasMany(CarteAutorisee, { foreignKey: 'groupeId', as: 'cartesAutorisees' });
CarteAutorisee.belongsTo(GroupeAdmin, { foreignKey: 'groupeId', as: 'groupe' });

TypeContrat.hasMany(Client, { foreignKey: 'typeContratId', as: 'clients' });
Client.belongsTo(TypeContrat, { foreignKey: 'typeContratId', as: 'typeContrat' });

GroupeAdmin.belongsToMany(TypeContrat, {
    through: GroupeTypeContrat,
    foreignKey: 'groupeId',
    otherKey: 'typeContratId',
    as: 'typesContrat'
});
TypeContrat.belongsToMany(GroupeAdmin, {
    through: GroupeTypeContrat,
    foreignKey: 'typeContratId',
    otherKey: 'groupeId',
    as: 'groupes'
});

/**
 * Crée les types par défaut et retourne une map code → id.
 */
const ensureDefaultTypesContrat = async () => {
    await TypeContrat.sync();
    const defaultTypes = [
        { code: 'Business', libelle: 'Business', ordre: 1 },
        { code: 'Platinum', libelle: 'Platinum', ordre: 2 },
        { code: 'Premier', libelle: 'Premier', ordre: 3 }
    ];
    for (const t of defaultTypes) {
        await TypeContrat.findOrCreate({ where: { code: t.code }, defaults: { ...t, isActive: true } });
    }
    const types = await TypeContrat.findAll();
    return new Map(types.map((t) => [t.code, t.id]));
};

/**
 * Migre les clients vers typeContratId et corrige les valeurs invalides.
 */
const migrateClientTypeContrat = async () => {
    const queryInterface = sequelize.getQueryInterface();
    let tableDesc;
    try {
        tableDesc = await queryInterface.describeTable('clients');
    } catch {
        return;
    }

    const byCode = await ensureDefaultTypesContrat();
    const fallbackId = byCode.get('Business') || [...byCode.values()][0];

    if (tableDesc.typeContrat && !tableDesc.typeContratId) {
        await queryInterface.addColumn('clients', 'typeContratId', {
            type: sequelize.Sequelize.UUID,
            allowNull: true
        });

        const [clients] = await sequelize.query('SELECT id, typeContrat FROM clients WHERE typeContrat IS NOT NULL');
        for (const row of clients) {
            const typeId = byCode.get(row.typeContrat) || fallbackId;
            await sequelize.query('UPDATE clients SET typeContratId = ? WHERE id = ?', {
                replacements: [typeId, row.id]
            });
        }

        await queryInterface.removeColumn('clients', 'typeContrat');
        console.log('Migration clients.typeContrat → typeContratId terminée');
    }

    if (tableDesc.typeContratId || tableDesc.typeContrat) {
        await sequelize.query(
            'UPDATE clients SET typeContratId = ? WHERE typeContratId IS NULL OR typeContratId = ?',
            { replacements: [fallbackId, ''] }
        );
        const [invalid] = await sequelize.query(
            `SELECT c.id FROM clients c
             LEFT JOIN types_contrat t ON c.typeContratId = t.id
             WHERE t.id IS NULL AND c.typeContratId IS NOT NULL AND c.typeContratId != ''`
        );
        for (const row of invalid) {
            await sequelize.query('UPDATE clients SET typeContratId = ? WHERE id = ?', {
                replacements: [fallbackId, row.id]
            });
        }
    }
};

/**
 * Synchroniser tous les modèles avec la base de données
 * @param {boolean} force - Si true, supprime et recrée les tables
 */
const syncModels = async (force = false) => {
    try {
        if (!force) {
            await migrateClientTypeContrat();
        }
        await sequelize.sync({ force, alter: !force });
        await Administrateur.update(
            { interfaceLinks: DEFAULT_SUPER_ADMIN_LINKS },
            { where: { role: 'SUPER_ADMIN' } }
        );
        console.log(`Modèles synchronisés ${force ? '(tables recréées)' : '(tables mises à jour)'}`);
    } catch (error) {
        console.error('Erreur lors de la synchronisation des modèles:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    ...models,
    syncModels
};
