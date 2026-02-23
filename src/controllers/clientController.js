const { Client } = require('../models');

/**
 * Controller pour la gestion des clients
 */
class ClientController {
    /**
     * Créer un nouveau client
     * POST /api/clients
     */
    static async create(req, res) {
        try {
            const { nomClient, prenomClient, idCarteBancaire, typeContrat } = req.body;

            // Validation des données requises
            if (!nomClient || !prenomClient || !idCarteBancaire || !typeContrat) {
                return res.status(400).json({
                    success: false,
                    message: 'Les données requises sont manquantes'
                });
            }

            // Vérifier si le type de contrat est valide
            if (!['Business', 'Platinum', 'Premier'].includes(typeContrat)) {
                return res.status(400).json({
                    success: false,
                    message: 'Le type de contrat doit être Business, Platinum ou Premier'
                });
            }

            // Vérifier si l'ID de la carte bancaire existe déjà (actif ou soft-deleted)
            const existingClient = await Client.findOne({
                where: { idCarteBancaire },
                paranoid: false
            });

            if (existingClient) {
                if (existingClient.deletedAt === null) {
                    return res.status(409).json({
                        success: false,
                        message: 'Un client avec cet ID de carte bancaire existe déjà'
                    });
                }
                // Client soft-deleted : restore() remet deletedAt à null (méthode Sequelize paranoid)
                await existingClient.restore();
                existingClient.set({ nomClient, prenomClient, typeContrat });
                await existingClient.save();
                return res.status(200).json({
                    success: true,
                    message: 'Client cree créé succès',
                    data: existingClient
                });
            }

            // Créer le client
            const client = await Client.create({
                nomClient,
                prenomClient,
                idCarteBancaire,
                typeContrat
            });

            return res.status(201).json({
                success: true,
                message: 'Client créé avec succès',
                data: client
            });

        } catch (error) {
            console.error('Erreur lors de la création du client:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du client',
                errors: error.errors.map(err => err.message)
            });
        }
    }

    /**
     * Récupérer tous les clients (paginé, 10 par page par défaut)
     * GET /api/clients?page=1&limit=10
     */
    static async getAll(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
            const offset = (pageNum - 1) * limitNum;

            const { count, rows: clients } = await Client.findAndCountAll({
                order: [['createdAt', 'DESC']],
                limit: limitNum,
                offset
            });

            return res.status(200).json({
                success: true,
                message: 'Clients récupérés avec succès',
                data: clients,
                meta: {
                    page: pageNum,
                    limit: limitNum,
                    total: count,
                    totalPages: Math.ceil(count / limitNum)
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des clients:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des clients',
                errors: error.errors.map(err => err.message)
            });
        }
    }

    /**
     * Récupérer un client par ID
     * GET /api/clients/:id
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const client = await Client.findByPk(id);
            return res.status(200).json({
                success: true,
                message: 'Client récupéré avec succès',
                data: client
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du client:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du client',
                errors: error.errors.map(err => err.message)
            });
        }
    }
    
    /**
     * Mettre à jour un client (seuls les champs fournis et différents sont modifiés)
     * PUT /api/clients/:id
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { nomClient, prenomClient, idCarteBancaire, typeContrat } = req.body;

            const existingClient = await Client.findByPk(id);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé'
                });
            }

            const typesContratValides = ['Business', 'Platinum', 'Premier'];

            if (typeContrat !== undefined) {
                if (!typesContratValides.includes(typeContrat)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Le type de contrat doit être Business, Platinum ou Premier'
                    });
                }
                if (typeContrat !== existingClient.typeContrat) existingClient.typeContrat = typeContrat;
            }
            
            if (nomClient !== undefined && nomClient !== existingClient.nomClient) existingClient.nomClient = nomClient;
            if (prenomClient !== undefined && prenomClient !== existingClient.prenomClient) existingClient.prenomClient = prenomClient;
            if (idCarteBancaire !== undefined && idCarteBancaire !== existingClient.idCarteBancaire) {
                const autreClient = await Client.findOne({ where: { idCarteBancaire } });
                if (autreClient) {
                    return res.status(409).json({
                        success: false,
                        message: 'Un client avec cet ID de carte bancaire existe déjà'
                    });
                }
                existingClient.idCarteBancaire = idCarteBancaire;
            }

            await existingClient.save();
            return res.status(200).json({
                success: true,
                message: 'Client mis à jour avec succès',
                data: existingClient
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour du client:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du client',
                errors: error.errors.map(err => err.message)
            });
        }
    }

    /**
     * Supprimer un client
     * DELETE /api/clients/:id
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const client = await Client.findByPk(id);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé'
                });
            }
            await client.destroy();
            return res.status(200).json({
                success: true,
                message: 'Client supprimé avec succès',
                data: client
            });
        } catch (error) {
            console.error('Erreur lors de la suppression du client:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du client',
                errors: error.errors.map(err => err.message)
            });
        }
    }
}

module.exports = ClientController;