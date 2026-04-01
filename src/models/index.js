const sequelize = require('../config/database');
const Administrateur = require('./Administrateur');
const Client = require('./Client');
const Partenaire = require('./Partenaire');
const GroupeAdmin = require('./GroupeAdmin');
const CarteAutorisee = require('./CarteAutorisee');
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
    CarteAutorisee
};

// Relations
Partenaire.hasMany(GroupeAdmin, { foreignKey: 'partenaireId', as: 'groupes' });
GroupeAdmin.belongsTo(Partenaire, { foreignKey: 'partenaireId', as: 'partenaire' });

GroupeAdmin.hasMany(Administrateur, { foreignKey: 'groupeId', as: 'administrateurs' });
Administrateur.belongsTo(GroupeAdmin, { foreignKey: 'groupeId', as: 'groupe' });

GroupeAdmin.hasMany(CarteAutorisee, { foreignKey: 'groupeId', as: 'cartesAutorisees' });
CarteAutorisee.belongsTo(GroupeAdmin, { foreignKey: 'groupeId', as: 'groupe' });

/**
 * Synchroniser tous les modèles avec la base de données
 * @param {boolean} force - Si true, supprime et recrée les tables
 */
const syncModels = async (force = false) => {
    try {
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