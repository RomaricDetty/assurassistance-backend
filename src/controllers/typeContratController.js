const fs = require('fs');
const path = require('path');
const { TypeContrat } = require('../models');
const TypeContratHelper = require('../utils/typeContratHelper');
const { contratsDir } = require('../middleware/uploadPdf');

/**
 * Controller pour la gestion des types de contrat et leurs PDF.
 */
class TypeContratController {
    /**
     * Enregistre le chemin public d'un PDF uploadé.
     */
    static buildPdfPath(filename) {
        return `/uploads/contrats/${filename}`;
    }

    /**
     * Supprime un fichier PDF du disque.
     */
    static removePdfFile(pdfPath) {
        if (!pdfPath) return;
        const filename = path.basename(pdfPath);
        const fullPath = path.join(contratsDir, filename);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    }

    /**
     * Créer un type de contrat (optionnellement avec PDF).
     */
    static async create(req, res) {
        try {
            const { code, libelle, description, ordre, isActive } = req.body;
            if (!code || !libelle) {
                return res.status(400).json({ success: false, message: 'code et libelle sont requis' });
            }

            const existing = await TypeContrat.findOne({ where: { code } });
            if (existing) {
                return res.status(409).json({ success: false, message: 'Un type de contrat avec ce code existe déjà' });
            }

            const payload = {
                code: `${code}`.trim(),
                libelle: `${libelle}`.trim(),
                description: description || null,
                ordre: ordre !== undefined ? parseInt(ordre, 10) || 0 : 0,
                isActive: isActive !== undefined ? isActive === true || isActive === 'true' : true
            };

            if (req.file) {
                payload.pdfPath = TypeContratController.buildPdfPath(req.file.filename);
                payload.pdfFileName = req.file.originalname;
            }

            const typeContrat = await TypeContrat.create(payload);
            return res.status(201).json({
                success: true,
                data: TypeContratHelper.formatTypeContrat(typeContrat)
            });
        } catch (error) {
            if (req.file) TypeContratController.removePdfFile(TypeContratController.buildPdfPath(req.file.filename));
            return res.status(500).json({ success: false, message: 'Erreur lors de la création du type de contrat' });
        }
    }

    /**
     * Lister tous les types de contrat.
     */
    static async getAll(req, res) {
        try {
            const { activeOnly } = req.query;
            const where = {};
            if (activeOnly === 'true') where.isActive = true;

            const types = await TypeContrat.findAll({
                where,
                order: [['ordre', 'ASC'], ['libelle', 'ASC']]
            });

            return res.status(200).json({
                success: true,
                data: types.map(TypeContratHelper.formatTypeContrat)
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des types de contrat' });
        }
    }

    /**
     * Récupérer un type de contrat par id.
     */
    static async getById(req, res) {
        try {
            const typeContrat = await TypeContrat.findByPk(req.params.id);
            if (!typeContrat) {
                return res.status(404).json({ success: false, message: 'Type de contrat non trouvé' });
            }
            return res.status(200).json({
                success: true,
                data: TypeContratHelper.formatTypeContrat(typeContrat)
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la récupération du type de contrat' });
        }
    }

    /**
     * Mettre à jour un type de contrat (PDF optionnel).
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { code, libelle, description, ordre, isActive } = req.body;
            const typeContrat = await TypeContrat.findByPk(id);
            if (!typeContrat) {
                if (req.file) TypeContratController.removePdfFile(TypeContratController.buildPdfPath(req.file.filename));
                return res.status(404).json({ success: false, message: 'Type de contrat non trouvé' });
            }

            if (code !== undefined && code !== typeContrat.code) {
                const duplicate = await TypeContrat.findOne({ where: { code } });
                if (duplicate) {
                    return res.status(409).json({ success: false, message: 'Un type de contrat avec ce code existe déjà' });
                }
                typeContrat.code = `${code}`.trim();
            }
            if (libelle !== undefined) typeContrat.libelle = `${libelle}`.trim();
            if (description !== undefined) typeContrat.description = description || null;
            if (ordre !== undefined) typeContrat.ordre = parseInt(ordre, 10) || 0;
            if (isActive !== undefined) typeContrat.isActive = isActive === true || isActive === 'true';

            if (req.file) {
                TypeContratController.removePdfFile(typeContrat.pdfPath);
                typeContrat.pdfPath = TypeContratController.buildPdfPath(req.file.filename);
                typeContrat.pdfFileName = req.file.originalname;
            }

            await typeContrat.save();
            return res.status(200).json({
                success: true,
                data: TypeContratHelper.formatTypeContrat(typeContrat)
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du type de contrat' });
        }
    }

    /**
     * Supprimer un type de contrat (soft delete).
     */
    static async delete(req, res) {
        try {
            const typeContrat = await TypeContrat.findByPk(req.params.id);
            if (!typeContrat) {
                return res.status(404).json({ success: false, message: 'Type de contrat non trouvé' });
            }
            await typeContrat.destroy();
            return res.status(200).json({ success: true, message: 'Type de contrat supprimé' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur lors de la suppression du type de contrat' });
        }
    }
}

module.exports = TypeContratController;
