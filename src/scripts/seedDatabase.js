const { Administrateur } = require('../models');

/**
 * Script pour peupler la base de données avec des données initiales
 */
const seedDatabase = async () => {
    try {
        console.log('Démarrage du seeding...');

        

        // 1. Créer des administrateurs par défaut
        const administrateurs = [
            {
                login: 'assurassistance_user',
                password: 'M@nagement_123',
                nom: 'Assur',
                prenom: 'Assistance',
                email: 'assurassistanceyao@gmail.com',
                isActive: true
            },
            {
                login: 'romdja',
                password: 'Secure@1234',
                nom: 'Detty',
                prenom: 'Romaric',
                email: 'romaricdetty@gmail.com',
                isActive: true
            },
            {
                login: 'angem',
                password: 'Secure@1234',
                nom: 'Ange-Emmanuel',
                prenom: 'ATTOUMBRE',
                email: 'angemattoumbre@gmail.com',
                isActive: true
            }
        ];

        for (const administrateurData of administrateurs) {
            try {
                const [administrateur, created] = await Administrateur.findOrCreate({
                    where: { login: administrateurData.login },
                    defaults: administrateurData
                });
                if (created) {
                    console.log(`Administrateur créé: ${administrateurData.login}`);
                } else {
                    console.log(`Administrateur déjà existant: ${administrateurData.login}`);
                }
            } catch (error) {
                console.error(`Erreur lors de la création de l'administrateur ${administrateurData.login}:`, error.message);
            }
        }

        console.log('\nSeeding terminé avec succès !');
        // Ne pas appeler process.exit() si appelé depuis le serveur
        if (require.main === module) {
            process.exit(0);
        }
    } catch (error) {
        console.error('Erreur lors du seeding:', error);
        // Ne pas appeler process.exit() si appelé depuis le serveur
        if (require.main === module) {
            process.exit(1);
        } else {
            throw error; // Propager l'erreur si appelé depuis le serveur
        }
    }
};

// Exporter la fonction pour pouvoir l'utiliser dans server.js
module.exports = seedDatabase;

// Exécuter le script uniquement si appelé directement
if (require.main === module) {
    seedDatabase();
}