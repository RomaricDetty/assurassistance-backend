/**
 * Middleware d'autorisation basé sur les rôles.
 * @param {...string} roles - Rôles autorisés.
 * @returns {Function} middleware Express.
 */
const authorizeRoles = (...roles) => {
    /**
     * Vérifie si l'utilisateur connecté a un rôle autorisé.
     */
    return (req, res, next) => {
        if (!req.administrateur) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non authentifié'
            });
        }

        const role = req.administrateur.role || 'SUPER_ADMIN';
        if (!roles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas les droits pour effectuer cette action'
            });
        }
        next();
    };
};

module.exports = authorizeRoles;
