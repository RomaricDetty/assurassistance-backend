const { Partenaire } = require('../models');

/**
 * Controller pour la gestion des partenaires.
 */
class PartenaireController {
    /**
     * Créer un partenaire.
     */
    static async create(req, res) {
        try {
            const { nom, contact, adresse, isActive } = req.body;
            if (!nom) {
                return res.status(400).json({ success: false, message: 'Le nom du partenaire est obligatoire' });
            }
            const partenaire = await Partenaire.create({
                nom,
                contact: contact || null,
                adresse: adresse || null,
                isActive: isActive !== undefined ? isActive : true
            });
            return res.status(201).json({ success: true, data: partenaire });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la création du partenaire' });
        }
    }

    /**
     * Lister les partenaires.
     */
    static async getAll(req, res) {
        try {
            const partenaires = await Partenaire.findAll({ order: [['createdAt', 'DESC']] });
            return res.status(200).json({ success: true, data: partenaires });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des partenaires' });
        }
    }

    /**
     * Mettre à jour un partenaire.
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { nom, contact, adresse, isActive } = req.body;
            const partenaire = await Partenaire.findByPk(id);
            if (!partenaire) {
                return res.status(404).json({ success: false, message: 'Partenaire non trouvé' });
            }
            if (nom !== undefined) partenaire.nom = nom;
            if (contact !== undefined) partenaire.contact = contact;
            if (adresse !== undefined) partenaire.adresse = adresse;
            if (isActive !== undefined) partenaire.isActive = isActive;
            await partenaire.save();
            return res.status(200).json({ success: true, data: partenaire });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du partenaire' });
        }
    }

    /**
     * Supprimer un partenaire (soft delete).
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const partenaire = await Partenaire.findByPk(id);
            if (!partenaire) {
                return res.status(404).json({ success: false, message: 'Partenaire non trouvé' });
            }
            await partenaire.destroy();
            return res.status(200).json({ success: true, message: 'Partenaire supprimé' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la suppression du partenaire' });
        }
    }
}

module.exports = PartenaireController;
