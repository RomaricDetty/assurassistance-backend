const jwt = require('jsonwebtoken');
const { Administrateur } = require('../models');

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
            attributes: { exclude: ['password'] }
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
