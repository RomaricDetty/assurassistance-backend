const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration avec valeurs par défaut
const dbName = process.env.DB_NAME || 'assurassistance_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;

const sequelize = new Sequelize(
    dbName,
    dbUser,
    dbPassword,
    {
        host: dbHost,
        port: dbPort,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        timezone: '+00:00',
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true
        }
    }
);

/**
 * Tester la connexion à la base de données
 * Cette fonction est appelée manuellement depuis le serveur
 */
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connexion à la base de données réussie');
        return true;
    } catch (error) {
        console.error('Erreur de connexion à la base de données:', error);
        return false;
    }
};

module.exports = sequelize;
module.exports.testConnection = testConnection;