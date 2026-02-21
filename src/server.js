const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const { syncModels } = require('./models');
const routes = require('./routes');
const seedDatabase = require('./scripts/seedDatabase');

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware pour logger les requêtes (en développement)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// Configuration Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Assur\'Assistance - Documentation',
    customfavIcon: '/favicon.ico'
}));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static('uploads'));

// Routes de l'API
app.use('/api', routes);

// Route racine
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Bienvenue sur l\'API Assur\'Assistance Backend',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            health: '/api/health',
            administrateurs: '/api/administrateurs',
        }
    });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Initialiser le serveur
const startServer = async () => {
    try {
        // Synchroniser les modèles avec la base de données
        // En production, utilisez les migrations au lieu de sync()
        await syncModels(false);

        // Exécuter le seeding de la base de données
        console.log('Exécution du seeding de la base de données...');
        await seedDatabase();

        // Démarrer le serveur
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  Serveur démarré avec succès !                        ║
║                                                       ║
║  Port: ${PORT}                                        ║
║  URL: http://localhost:${PORT}                        ║
║  API: http://localhost:${PORT}/api                    ║
║  Documentation Swagger: http://localhost:${PORT}/api-docs║
║  Environment: ${process.env.NODE_ENV || 'development'}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
};

// Gestion de l'arrêt gracieux
process.on('SIGTERM', () => {
    console.log('SIGTERM reçu, arrêt du serveur...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT reçu, arrêt du serveur...');
    process.exit(0);
});

// Démarrer le serveur
startServer();

module.exports = app;