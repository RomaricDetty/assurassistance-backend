const swaggerJsdoc = require('swagger-jsdoc');

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
                url: 'http://localhost:3000/api',
                description: 'Serveur de développement'
            },
            // {
            //     url: 'http://5.182.17.192:6981/api',
            //     description: 'Serveur VPS de production'
            // }
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
                name: '404 Error',
                description: 'Route non trouvée'
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
