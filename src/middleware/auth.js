const jwt = require('jsonwebtoken');
const { Administrateur, GroupeAdmin, Partenaire } = require('../models');
const { getEffectiveInterfaceLinks } = require('../constants/interfaceLinks');

/**
 * Middleware d'authentification par Bearer token
 * Vérifie la présence et la validité du token JWT dans le header Authorization
 */
const authenticate = async (req, res, next) => {
    try {
        // Récupérer le token depuis le header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Token d\'authentification manquant. Veuillez fournir un Bearer token.'
            });
        }

        // Vérifier le format "Bearer <token>"
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({
                success: false,
                message: 'Format de token invalide.'
            });
        }

        const token = parts[1];

        // Vérifier et décoder le token
        const JWT_SECRET = process.env.JWT_SECRET || '1ts@assurassistance-$ecret-k3y_f4r==projEct-ch@nge-in-p@';
        const decoded = jwt.verify(token, JWT_SECRET);

        // Récupérer l'administrateur depuis la base de données
        const administrateur = await Administrateur.findByPk(decoded.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: GroupeAdmin,
                    as: 'groupe',
                    include: [{ model: Partenaire, as: 'partenaire' }]
                }
            ]
        });

        if (!administrateur) {
            return res.status(401).json({
                success: false,
                message: 'Administrateur non trouvé'
            });
        }

        // Vérifier que l'admin est actif
        if (!administrateur.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Compte administrateur désactivé'
            });
        }

        const now = new Date();
        const role = administrateur.role || 'SUPER_ADMIN';
        administrateur.role = role;
        administrateur.interfaceLinks = getEffectiveInterfaceLinks(role, administrateur.interfaceLinks);
        if (administrateur.userValidFrom && now < administrateur.userValidFrom) {
            return res.status(403).json({
                success: false,
                message: 'Compte utilisateur pas encore valide'
            });
        }
        if (administrateur.userValidTo && now > administrateur.userValidTo) {
            return res.status(403).json({
                success: false,
                message: 'Période de validité du compte expirée'
            });
        }
        if (role === 'AGENT') {
            if (!administrateur.groupe) {
                return res.status(403).json({
                    success: false,
                    message: 'Aucun groupe associé à ce compte agent'
                });
            }
            if (!administrateur.groupe.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Le groupe de cet agent est désactivé'
                });
            }
            if (administrateur.groupe.validFrom && now < administrateur.groupe.validFrom) {
                return res.status(403).json({
                    success: false,
                    message: 'Période de validité du groupe non démarrée'
                });
            }
            if (administrateur.groupe.validTo && now > administrateur.groupe.validTo) {
                return res.status(403).json({
                    success: false,
                    message: 'Période de validité du groupe expirée'
                });
            }
            if (administrateur.groupe.partenaire && !administrateur.groupe.partenaire.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Le partenaire rattaché au groupe est désactivé'
                });
            }
        }

        // Ajouter l'admin à la requête pour utilisation dans les controllers
        req.administrateur = administrateur;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token invalide'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
        }
        console.error('Erreur authentification:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'authentification'
        });
    }
};

module.exports = authenticate;
