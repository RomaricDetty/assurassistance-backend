const { Op } = require('sequelize');
const { Client, CarteAutorisee, TypeContrat } = require('../models');
const TypeContratHelper = require('../utils/typeContratHelper');

/**
 * Controller pour la gestion des clients
 */
class ClientController {
    /**
     * Include Sequelize pour le type de contrat associé.
     */
    static get typeContratInclude() {
        return {
            model: TypeContrat,
            as: 'typeContrat',
            attributes: ['id', 'code', 'libelle', 'pdfPath', 'pdfFileName', 'isActive']
        };
    }

    /**
     * Formate un client pour la réponse API.
     */
    static formatClient(client) {
        if (!client) return client;
        const plain = client.toJSON ? client.toJSON() : { ...client };
        if (plain.typeContrat) {
            plain.typeContrat = TypeContratHelper.formatTypeContrat(plain.typeContrat);
            plain.typeContratCode = plain.typeContrat.code;
        }
        return plain;
    }

    /**
     * Résout et valide le type de contrat depuis le body (typeContratId ou code legacy typeContrat).
     */
    static async resolveAndValidateTypeContrat(body, administrateur) {
        const { typeContratId, typeContrat: typeContratCode } = body;
        if (!typeContratId && !typeContratCode) {
            return { error: { status: 400, message: 'typeContratId (ou typeContrat/code) est requis' } };
        }

        const typeContrat = await TypeContratHelper.resolveTypeContratId({
            typeContratId,
            code: typeContratCode
        });

        if (!typeContrat) {
            return { error: { status: 400, message: 'Type de contrat invalide ou inactif' } };
        }

        const allowed = await TypeContratHelper.isTypeAllowedForAgent(administrateur, typeContrat.id);
        if (!allowed) {
            return {
                error: {
                    status: 403,
                    message: 'Ce type de contrat n\'est pas autorisé pour votre groupe'
                }
            };
        }

        return { typeContratId: typeContrat.id, typeContrat };
    }

    /**
     * Vérifie qu'un agent a le droit d'utiliser un numéro de carte.
     */
    static async isCardAllowedForAgent(administrateur, numeroCarte) {
        if (!administrateur || (administrateur.role || 'SUPER_ADMIN') !== 'AGENT') {
            return true;
        }
        if (!administrateur.groupeId) {
            return false;
        }
        const carte = await CarteAutorisee.findOne({
            where: {
                groupeId: administrateur.groupeId,
                numeroCarte,
                isActive: true
            }
        });
        return !!carte;
    }

    /**
     * Créer un nouveau client
     * POST /api/clients
     */
    static async create(req, res) {
        try {
            const { nomClient, prenomClient, idCarteBancaire } = req.body;

            if (!nomClient || !prenomClient || !idCarteBancaire) {
                return res.status(400).json({
                    success: false,
                    message: 'Les données requises sont manquantes'
                });
            }

            const typeResult = await ClientController.resolveAndValidateTypeContrat(req.body, req.administrateur);
            if (typeResult.error) {
                return res.status(typeResult.error.status).json({
                    success: false,
                    message: typeResult.error.message
                });
            }

            const allowed = await ClientController.isCardAllowedForAgent(req.administrateur, idCarteBancaire);
            if (!allowed) {
                return res.status(403).json({
                    success: false,
                    message: 'Vous n\'avez pas le droit d\'enregistrer ce client: numéro de carte non autorisé pour votre groupe'
                });
            }

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
                await existingClient.restore();
                existingClient.set({
                    nomClient,
                    prenomClient,
                    typeContratId: typeResult.typeContratId
                });
                await existingClient.save();
                await existingClient.reload({ include: [ClientController.typeContratInclude] });
                return res.status(200).json({
                    success: true,
                    message: 'Client réactivé avec succès',
                    data: ClientController.formatClient(existingClient)
                });
            }

            const client = await Client.create({
                nomClient,
                prenomClient,
                idCarteBancaire,
                typeContratId: typeResult.typeContratId
            });
            await client.reload({ include: [ClientController.typeContratInclude] });

            return res.status(201).json({
                success: true,
                message: 'Client créé avec succès',
                data: ClientController.formatClient(client)
            });
        } catch (error) {
            console.error('Erreur lors de la création du client:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du client',
                errors: error.errors?.map((err) => err.message) || [error.message]
            });
        }
    }

    /** Nombre max de clients par requête bulk (évite timeouts et surcharge) */
    static get BULK_MAX() { return 2000; }

    /**
     * Créer plusieurs clients en une requête (même logique que create : restauration si soft-deleted).
     * POST /api/clients/bulk
     */
    static async createMany(req, res) {
        try {
            const clients = Array.isArray(req.body) ? req.body : req.body?.clients;

            if (!Array.isArray(clients) || clients.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Le body doit contenir un tableau "clients" non vide',
                    reqBody: req.body
                });
            }

            const resolvedClients = [];
            for (const c of clients) {
                const { nomClient, prenomClient, idCarteBancaire } = c;
                if (!nomClient || !prenomClient || !idCarteBancaire) {
                    return res.status(400).json({
                        success: false,
                        message: 'Chaque client doit avoir nomClient, prenomClient, idCarteBancaire et typeContratId (ou typeContrat)'
                    });
                }
                const typeResult = await ClientController.resolveAndValidateTypeContrat(c, req.administrateur);
                if (typeResult.error) {
                    return res.status(typeResult.error.status).json({
                        success: false,
                        message: `${typeResult.error.message} (${idCarteBancaire})`
                    });
                }
                resolvedClients.push({ ...c, typeContratId: typeResult.typeContratId });
            }

            if ((req.administrateur?.role || 'SUPER_ADMIN') === 'AGENT') {
                const groupId = req.administrateur.groupeId;
                if (!groupId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Aucun groupe associé à cet agent'
                    });
                }
                const cardIds = [...new Set(resolvedClients.map((c) => c.idCarteBancaire))];
                const allowedCards = await CarteAutorisee.findAll({
                    where: {
                        groupeId: groupId,
                        isActive: true,
                        numeroCarte: { [Op.in]: cardIds }
                    }
                });
                const allowedSet = new Set(allowedCards.map((c) => c.numeroCarte));
                const unauthorized = cardIds.filter((c) => !allowedSet.has(c));
                if (unauthorized.length > 0) {
                    return res.status(403).json({
                        success: false,
                        message: 'Certains numéros de carte ne sont pas autorisés pour votre groupe',
                        unauthorizedCards: unauthorized.slice(0, 50)
                    });
                }
            }

            const allCreated = [];
            const allReactivated = [];
            const allConflicts = [];
            const max = ClientController.BULK_MAX;

            for (let i = 0; i < resolvedClients.length; i += max) {
                const chunk = resolvedClients.slice(i, i + max);
                const ids = chunk.map((c) => c.idCarteBancaire);

                const existingList = await Client.findAll({
                    where: { idCarteBancaire: { [Op.in]: ids } },
                    paranoid: false
                });
                const byCard = new Map(existingList.map((e) => [e.idCarteBancaire, e]));

                const created = [];
                const reactivated = [];
                const conflicts = [];
                const seenInChunk = new Set();
                const toReactivate = [];

                for (const c of chunk) {
                    const { nomClient, prenomClient, idCarteBancaire, typeContratId } = c;
                    if (seenInChunk.has(idCarteBancaire)) {
                        conflicts.push({ idCarteBancaire, reason: 'Doublon dans le lot' });
                        continue;
                    }
                    seenInChunk.add(idCarteBancaire);

                    const existing = byCard.get(idCarteBancaire);

                    if (existing) {
                        if (existing.deletedAt !== null) {
                            existing.set({ nomClient, prenomClient, typeContratId });
                            toReactivate.push(existing);
                        } else {
                            conflicts.push({ idCarteBancaire, reason: 'Déjà existant' });
                        }
                    } else {
                        created.push({ nomClient, prenomClient, idCarteBancaire, typeContratId });
                    }
                }

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
                errors: Array.isArray(error.errors) ? error.errors.map((e) => e.message) : [error.message]
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
            const limitNum = Math.min(1000, Math.max(1, parseInt(limit, 10) || 10));
            const offset = (pageNum - 1) * limitNum;

            const { count, rows: clients } = await Client.findAndCountAll({
                include: [ClientController.typeContratInclude],
                order: [['createdAt', 'DESC']],
                limit: limitNum,
                offset
            });

            return res.status(200).json({
                success: true,
                message: 'Clients récupérés avec succès',
                data: clients.map(ClientController.formatClient),
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
                errors: error.errors?.map((err) => err.message) || [error.message]
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
            const client = await Client.findByPk(id, {
                include: [ClientController.typeContratInclude]
            });
            if (!client) {
                return res.status(404).json({ success: false, message: 'Client non trouvé' });
            }
            return res.status(200).json({
                success: true,
                message: 'Client récupéré avec succès',
                data: ClientController.formatClient(client)
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du client:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du client',
                errors: error.errors?.map((err) => err.message) || [error.message]
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
            const { nomClient, prenomClient, idCarteBancaire } = req.body;

            const existingClient = await Client.findByPk(id);
            if (!existingClient) {
                return res.status(404).json({
                    success: false,
                    message: 'Client non trouvé'
                });
            }

            if (req.body.typeContratId !== undefined || req.body.typeContrat !== undefined) {
                const typeResult = await ClientController.resolveAndValidateTypeContrat(req.body, req.administrateur);
                if (typeResult.error) {
                    return res.status(typeResult.error.status).json({
                        success: false,
                        message: typeResult.error.message
                    });
                }
                if (typeResult.typeContratId !== existingClient.typeContratId) {
                    existingClient.typeContratId = typeResult.typeContratId;
                }
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
            await existingClient.reload({ include: [ClientController.typeContratInclude] });
            return res.status(200).json({
                success: true,
                message: 'Client mis à jour avec succès',
                data: ClientController.formatClient(existingClient)
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du client:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du client',
                errors: error.errors?.map((err) => err.message) || [error.message]
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
                errors: error.errors?.map((err) => err.message) || [error.message]
            });
        }
    }
}

module.exports = ClientController;
