const sequelize = require('../config/database');
const Administrateur = require('./Administrateur');
const Client = require('./Client');

/**
 * Fichier central pour exporter tous les modèles
 * Les relations sont déjà définies dans chaque modèle
 */

const models = {
    Administrateur,
    Client,
};

/**
 * Synchroniser tous les modèles avec la base de données
 * @param {boolean} force - Si true, supprime et recrée les tables
 */
const syncModels = async (force = false) => {
    try {
        await sequelize.sync({ force, alter: !force });
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