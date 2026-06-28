const { TypeContrat, GroupeTypeContrat } = require('../models');

/**
 * Utilitaires pour la validation et la résolution des types de contrat.
 */
class TypeContratHelper {
    /**
     * Résout un typeContratId à partir d'un id ou d'un code.
     */
    static async resolveTypeContratId({ typeContratId, code }) {
        if (typeContratId) {
            const type = await TypeContrat.findOne({ where: { id: typeContratId, isActive: true } });
            return type || null;
        }
        if (code) {
            const type = await TypeContrat.findOne({ where: { code, isActive: true } });
            return type || null;
        }
        return null;
    }

    /**
     * Retourne les ids des types autorisés pour un groupe (tous si aucune restriction).
     */
    static async getAllowedTypeIdsForGroup(groupeId) {
        const links = await GroupeTypeContrat.findAll({
            where: { groupeId },
            attributes: ['typeContratId']
        });

        if (links.length === 0) {
            const all = await TypeContrat.findAll({
                where: { isActive: true },
                attributes: ['id'],
                order: [['ordre', 'ASC'], ['libelle', 'ASC']]
            });
            return all.map((t) => t.id);
        }

        const ids = links.map((l) => l.typeContratId);
        const active = await TypeContrat.findAll({
            where: { id: ids, isActive: true },
            attributes: ['id'],
            order: [['ordre', 'ASC'], ['libelle', 'ASC']]
        });
        return active.map((t) => t.id);
    }

    /**
     * Retourne les types autorisés pour un groupe avec leurs métadonnées.
     */
    static async getAllowedTypesForGroup(groupeId) {
        const ids = await TypeContratHelper.getAllowedTypeIdsForGroup(groupeId);
        if (ids.length === 0) return [];
        return TypeContrat.findAll({
            where: { id: ids, isActive: true },
            order: [['ordre', 'ASC'], ['libelle', 'ASC']]
        });
    }

    /**
     * Vérifie qu'un agent peut utiliser un type de contrat pour son groupe.
     */
    static async isTypeAllowedForAgent(administrateur, typeContratId) {
        if (!administrateur || (administrateur.role || 'SUPER_ADMIN') !== 'AGENT') {
            return true;
        }
        if (!administrateur.groupeId || !typeContratId) {
            return false;
        }
        const allowedIds = await TypeContratHelper.getAllowedTypeIdsForGroup(administrateur.groupeId);
        return allowedIds.includes(typeContratId);
    }

    /**
     * Formate un type de contrat pour la réponse API (inclut pdfUrl).
     */
    static formatTypeContrat(typeContrat) {
        if (!typeContrat) return null;
        const plain = typeContrat.toJSON ? typeContrat.toJSON() : { ...typeContrat };
        return {
            ...plain,
            pdfUrl: plain.pdfPath || null
        };
    }
}

module.exports = TypeContratHelper;
