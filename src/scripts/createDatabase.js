const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Script pour créer la base de données si elle n'existe pas
 */
const createDatabase = async () => {
    try {
        // Configuration avec valeurs par défaut
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root'
        };

        // Ne pas inclure le mot de passe s'il est vide ou non défini
        const password = process.env.DB_PASSWORD;
        if (password !== undefined && password !== '') {
            dbConfig.password = password;
        }

        const dbName = process.env.DB_NAME || 'assurassistance_db';

        console.log(`Tentative de connexion à MySQL sur ${dbConfig.host}:${dbConfig.port}...`);
        console.log(`Utilisateur: ${dbConfig.user}`);

        // Connexion sans spécifier de base de données
        const connection = await mysql.createConnection(dbConfig);

        console.log('Connecté au serveur MySQL');

        // Créer la base de données si elle n'existe pas
        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${dbName}\` 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci`
        );

        console.log(`Base de données "${dbName}" créée ou déjà existante`);

        await connection.end();
        console.log('Connexion fermée');

        process.exit(0);
    } catch (error) {
        console.error('Erreur lors de la création de la base de données:', error);
        
        // Messages d'aide selon le type d'erreur
        if (error.code === 'ECONNREFUSED') {
            console.error('\nConnexion refusée. Vérifiez que :');
            console.error('   1. MySQL/MariaDB est démarré');
            console.error('   2. Le serveur écoute sur le port correct');
            console.error('   3. Les paramètres de connexion sont corrects');
            console.error('\nPour démarrer MySQL sur macOS :');
            console.error('   brew services start mysql');
            console.error('   ou');
            console.error('   mysql.server start');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('\nAccès refusé. Vérifiez vos identifiants MySQL.');
            console.error('\nSolutions possibles :');
            console.error('   1. Créez un fichier .env à la racine du projet avec :');
            console.error('      DB_HOST=localhost');
            console.error('      DB_PORT=3306');
            console.error('      DB_USER=root');
            console.error('      DB_PASSWORD=votre_mot_de_passe');
            console.error('      DB_NAME=assurassistance_db');
            console.error('\n   2. Ou réinitialisez le mot de passe MySQL :');
            console.error('      mysql -u root -p');
            console.error('      ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'nouveau_mot_de_passe\';');
            console.error('\n   3. Ou testez sans mot de passe (si configuré ainsi) :');
            console.error('      Assurez-vous que DB_PASSWORD est vide ou non défini dans .env');
        }
        
        process.exit(1);
    }
};

createDatabase();