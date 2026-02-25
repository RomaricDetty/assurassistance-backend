const { Op } = require('sequelize');
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
                    message: 'Client réactivé avec succès',
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

    /** Nombre max de clients par requête bulk (évite timeouts et surcharge) */
    static get BULK_MAX() { return 2000; }

    /**
     * Créer plusieurs clients en une requête (même logique que create : restauration si soft-deleted).
     * Les tableaux trop gros sont découpés en paquets de BULK_MAX et traités séquentiellement.
     * POST /api/clients/bulk
     * Body: { "clients": [ { nomClient, prenomClient, idCarteBancaire, typeContrat }, ... ] }
     */
    static async createMany(req, res) {
        try {
            const clients = req.body;
            const TYPES_CONTRAT = ['Business', 'Platinum', 'Premier'];

            if (!Array.isArray(clients) || clients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Le body doit contenir un tableau "clients" non vide',
                    reqBody: req.body
                });
            }

            // Validation de toutes les lignes avant tout enregistrement
            for (const c of clients) {
                const { nomClient, prenomClient, idCarteBancaire, typeContrat } = c;
                if (!nomClient || !prenomClient || !idCarteBancaire || !typeContrat) {
                    return res.status(400).json({
                        success: false,
                        message: 'Chaque client doit avoir nomClient, prenomClient, idCarteBancaire et typeContrat'
                    });
                }
                if (!TYPES_CONTRAT.includes(typeContrat)) {
                    return res.status(400).json({
                        success: false,
                        message: `typeContrat invalide pour ${idCarteBancaire}: doit être Business, Platinum ou Premier`
                    });
                }
            }

            const allCreated = [];
            const allReactivated = [];
            const allConflicts = [];
            const max = ClientController.BULK_MAX;

            for (let i = 0; i < clients.length; i += max) {
                const chunk = clients.slice(i, i + max);
                const ids = chunk.map(c => c.idCarteBancaire);

                // Une seule requête par paquet au lieu de N findOne
                const existingList = await Client.findAll({
                    where: { idCarteBancaire: { [Op.in]: ids } },
                    paranoid: false
                });
                const byCard = new Map(existingList.map(e => [e.idCarteBancaire, e]));

                const created = [];
                const reactivated = [];
                const conflicts = [];
                const seenInChunk = new Set();

                const toReactivate = [];

                for (const c of chunk) {
                    const { nomClient, prenomClient, idCarteBancaire, typeContrat } = c;
                    if (seenInChunk.has(idCarteBancaire)) {
                        conflicts.push({ idCarteBancaire, reason: 'Doublon dans le lot' });
                        continue;
                    }
                    seenInChunk.add(idCarteBancaire);

                    const existing = byCard.get(idCarteBancaire);

                    if (existing) {
                        if (existing.deletedAt !== null) {
                            existing.set({ nomClient, prenomClient, typeContrat });
                            toReactivate.push(existing);
                        } else {
                            conflicts.push({ idCarteBancaire, reason: 'Déjà existant' });
                        }
                    } else {
                        created.push({ nomClient, prenomClient, idCarteBancaire, typeContrat });
                    }
                }

                // Réactivations en parallèle par lots (évite N await séquentiels)
                const RESTORE_BATCH = 50;
                for (let r = 0; r < toReactivate.length; r += RESTORE_BATCH) {
                    const batch = toReactivate.slice(r, r + RESTORE_BATCH);
                    await Promise.all(batch.map(async (inst) => {
                        await inst.restore();
                        await inst.save();
                    }));
                    reactivated.push(...batch);
                }

                const createdRecords = created.length > 0 ? await Client.bulkCreate(created) : [];
                allCreated.push(...createdRecords);
                allReactivated.push(...reactivated);
                allConflicts.push(...conflicts);
            }

            const totalCreated = allCreated.length;
            const totalReactivated = allReactivated.length;
            const totalConflicts = allConflicts.length;
            const MAX_RETURNED = 1000;
            const truncate = totalCreated + totalReactivated > MAX_RETURNED;

            return res.status(201).json({
                success: true,
                message: 'Import terminé',
                data: truncate
                    ? undefined
                    : {
                        created: allCreated,
                        reactivated: allReactivated
                    },
                meta: {
                    totalCreated,
                    totalReactivated,
                    conflictsCount: totalConflicts,
                    conflicts: totalConflicts > 0 ? allConflicts : undefined,
                    ...(truncate && { dataTruncated: true, messageDetail: `Plus de ${MAX_RETURNED} enregistrements : seuls les totaux sont renvoyés.` })
                }
            });
        } catch (error) {
            console.error('Erreur lors de la création des clients:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création des clients',
                errors: Array.isArray(error.errors) ? error.errors.map(e => e.message) : [error.message]
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