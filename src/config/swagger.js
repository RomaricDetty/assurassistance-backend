const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

/**
 * Configuration Swagger pour documenter toutes les APIs
 */
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Assur\'Assistance Backend',
            version: '1.0.0',
            description: 'Documentation complète de l\'API pour la plateforme Assur\'Assistance',
            contact: {
                name: 'Support API',
                email: 'support@assurassistance.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: process.env.SWAGGER_URL_DEV,
                description: 'Serveur de développement'
            },
            {
                url: process.env.SWAGGER_URL_PROD,
                description: 'Serveur VPS de production'
            }
        ],
        components: {
            schemas: {
                // Schémas de réponse communs
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'Opération réussie'
                        },
                        data: {
                            type: 'object'
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Erreur lors de l\'opération'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object'
                            }
                        }
                    }
                },
                Admin: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        login: { type: 'string' },
                        nom: { type: 'string' },
                        prenom: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        isActive: { type: 'boolean' },
                        lastLogin: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                Client: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        nomClient: { type: 'string' },
                        prenomClient: { type: 'string' },
                        idCarteBancaire: { type: 'string' },
                        typeContratId: { type: 'string', format: 'uuid' },
                        typeContrat: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                TypeContrat: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        code: { type: 'string', example: 'Business' },
                        libelle: { type: 'string', example: 'Contrat Business' },
                        description: { type: 'string' },
                        pdfPath: { type: 'string', example: '/uploads/contrats/xxx.pdf' },
                        pdfUrl: { type: 'string', example: '/uploads/contrats/xxx.pdf' },
                        pdfFileName: { type: 'string' },
                        ordre: { type: 'integer' },
                        isActive: { type: 'boolean' }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        tags: [
            {
                name: 'Health',
                description: 'Route de santé de l\'API'
            },
            {
                name: 'Administrateurs',
                description: 'Gestion des administrateurs de l\'API'
            },
            {
                name: 'Clients',
                description: 'Gestion des clients de l\'API'
            },
            {
                name: 'Partenaires',
                description: 'Gestion des partenaires'
            },
            {
                name: 'TypesContrat',
                description: 'Gestion dynamique des types de contrat et PDF associés'
            },
            {
                name: 'GroupesAdmin',
                description: 'Gestion des groupes d\'agents et cartes autorisées'
            },
            {
                name: 'GroupesPartner',
                description: 'Consultation des clients par groupe (agents et super admin)'
            },
            {
                name: '404 Error',
                description: 'Route non trouvée'
            },
            {
                name: '401 Error',
                description: 'Erreur d\'authentification'
            },
            {
                name: '403 Error',
                description: 'Erreur d\'autorisation'
            },
            {
                name: '400 Error',
                description: 'Erreur de validation'
            },
            {
                name: '409 Error',
                description: 'Erreur de conflit'
            },
            {
                name: '500 Error',
                description: 'Erreur interne du serveur'
            },
            {
                name: '200 Success',
                description: 'Opération réussie'
            }
        ]
    },
    apis: [
        './src/routes/*.js',
        './src/controllers/*.js',
        './src/server.js'
    ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
