const { Op } = require('sequelize');
const { GroupeAdmin, Partenaire, CarteAutorisee, Administrateur } = require('../models');
const { normalizeInterfaceLinks } = require('../constants/interfaceLinks');

/**
 * Controller pour la gestion des groupes d'agents.
 */
class GroupeAdminController {
    /**
     * Créer un groupe.
     */
    static async create(req, res) {
        try {
            const { nom, partenaireId, validFrom, validTo, isActive } = req.body;
            if (!nom || !partenaireId) {
                return res.status(400).json({ success: false, message: 'nom et partenaireId sont requis' });
            }
            const partenaire = await Partenaire.findByPk(partenaireId);
            if (!partenaire) {
                return res.status(404).json({ success: false, message: 'Partenaire non trouvé' });
            }
            const groupe = await GroupeAdmin.create({
                nom,
                partenaireId,
                validFrom: validFrom || null,
                validTo: validTo || null,
                isActive: isActive !== undefined ? isActive : true
            });
            return res.status(201).json({ success: true, data: groupe });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la création du groupe' });
        }
    }

    /**
     * Lister les groupes.
     */
    static async getAll(req, res) {
        try {
            const { partenaireId } = req.query;
            const where = {};
            if (partenaireId) where.partenaireId = partenaireId;
            const groupes = await GroupeAdmin.findAll({
                where,
                include: [{ model: Partenaire, as: 'partenaire' }],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json({ success: true, data: groupes });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des groupes' });
        }
    }

    /**
     * Mettre à jour un groupe.
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { nom, partenaireId, validFrom, validTo, isActive } = req.body;
            const groupe = await GroupeAdmin.findByPk(id);
            if (!groupe) {
                return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
            }
            if (partenaireId !== undefined) {
                const partenaire = await Partenaire.findByPk(partenaireId);
                if (!partenaire) {
                    return res.status(404).json({ success: false, message: 'Partenaire non trouvé' });
                }
                groupe.partenaireId = partenaireId;
            }
            if (nom !== undefined) groupe.nom = nom;
            if (validFrom !== undefined) groupe.validFrom = validFrom;
            if (validTo !== undefined) groupe.validTo = validTo;
            if (isActive !== undefined) groupe.isActive = isActive;
            await groupe.save();
            return res.status(200).json({ success: true, data: groupe });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du groupe' });
        }
    }

    /**
     * Supprimer un groupe.
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const groupe = await GroupeAdmin.findByPk(id);
            if (!groupe) {
                return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
            }
            await groupe.destroy();
            return res.status(200).json({ success: true, message: 'Groupe supprimé' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la suppression du groupe' });
        }
    }

    /**
     * Ajouter un lot de cartes autorisées à un groupe.
     */
    static async addCardsBulk(req, res) {
        try {
            const { id } = req.params;
            const payload = req.body?.cartes;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({ success: false, message: 'cartes doit être un tableau non vide' });
            }
            const groupe = await GroupeAdmin.findByPk(id);
            if (!groupe) {
                return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
            }

            const numeros = [...new Set(payload.map((v) => `${v}`.trim()).filter(Boolean))];
            const existing = await CarteAutorisee.findAll({
                where: {
                    groupeId: id,
                    numeroCarte: { [Op.in]: numeros }
                },
                paranoid: false
            });
            const byNumero = new Map(existing.map((e) => [e.numeroCarte, e]));
            const created = [];
            const reactivated = [];

            for (const numeroCarte of numeros) {
                const card = byNumero.get(numeroCarte);
                if (!card) {
                    created.push({ groupeId: id, numeroCarte, isActive: true });
                    continue;
                }
                if (card.deletedAt !== null) {
                    await card.restore();
                }
                if (!card.isActive) {
                    card.isActive = true;
                    await card.save();
                }
                reactivated.push(card.numeroCarte);
            }

            const createdRecords = created.length > 0 ? await CarteAutorisee.bulkCreate(created) : [];
            return res.status(201).json({
                success: true,
                data: {
                    created: createdRecords.length,
                    reactivated: reactivated.length
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout des cartes' });
        }
    }

    /**
     * Supprimer (désactiver) un lot de cartes autorisées d'un groupe.
     */
    static async deleteCardsBulk(req, res) {
        try {
            const { id } = req.params;
            const payload = req.body?.cartes;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({ success: false, message: 'cartes doit être un tableau non vide' });
            }
            const numeros = [...new Set(payload.map((v) => `${v}`.trim()).filter(Boolean))];
            const cards = await CarteAutorisee.findAll({
                where: { groupeId: id, numeroCarte: { [Op.in]: numeros } }
            });
            await Promise.all(cards.map(async (c) => c.destroy()));
            return res.status(200).json({ success: true, message: 'Cartes supprimées du groupe', count: cards.length });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la suppression des cartes' });
        }
    }

    /**
     * Lister les cartes autorisées d'un groupe.
     */
    static async getCards(req, res) {
        try {
            const { id } = req.params;
            const cartes = await CarteAutorisee.findAll({
                where: { groupeId: id },
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json({ success: true, data: cartes });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des cartes' });
        }
    }

    /**
     * Créer un utilisateur AGENT pour un groupe.
     */
    static async createAgent(req, res) {
        try {
            const { id } = req.params;
            const { login, password, nom, prenom, email, isActive, userValidFrom, userValidTo, interfaceLinks = [] } = req.body;
            if (!login || !password) {
                return res.status(400).json({ success: false, message: 'login et password sont requis' });
            }
            const groupe = await GroupeAdmin.findByPk(id);
            if (!groupe) {
                return res.status(404).json({ success: false, message: 'Groupe non trouvé' });
            }
            const existing = await Administrateur.findOne({ where: { login } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Un utilisateur avec ce login existe déjà' });
            }
            const agent = await Administrateur.create({
                login,
                password,
                nom: nom || null,
                prenom: prenom || null,
                email: email || null,
                isActive: isActive !== undefined ? isActive : true,
                role: 'AGENT',
                groupeId: id,
                userValidFrom: userValidFrom || null,
                userValidTo: userValidTo || null,
                interfaceLinks: normalizeInterfaceLinks(interfaceLinks)
            });
            return res.status(201).json({ success: true, data: agent });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'agent' });
        }
    }
}

module.exports = GroupeAdminController;
