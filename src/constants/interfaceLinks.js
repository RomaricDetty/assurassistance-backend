/**
 * Liens d'interface par défaut pour un SUPER_ADMIN.
 */
const DEFAULT_SUPER_ADMIN_LINKS = [
    '/',
    '/contrats-clients',
    '/clients',
    '/administration'
];

/**
 * Nettoie et normalise une liste de liens d'interface.
 * @param {string[]|undefined|null} links - Liens à normaliser.
 * @returns {string[]} Liste de liens unique et nettoyée.
 */
const normalizeInterfaceLinks = (links) => {
    if (!Array.isArray(links)) {
        return [];
    }
    const cleaned = links
        .map((l) => `${l}`.trim())
        .filter((l) => l.startsWith('/'));
    return [...new Set(cleaned)];
};

/**
 * Retourne les liens effectifs d'un utilisateur selon son rôle.
 * @param {string} role - Rôle de l'utilisateur.
 * @param {string[]|undefined|null} links - Liens enregistrés pour l'utilisateur.
 * @returns {string[]} Liens effectifs.
 */
const getEffectiveInterfaceLinks = (role, links) => {
    if (role === 'SUPER_ADMIN') {
        return DEFAULT_SUPER_ADMIN_LINKS;
    }
    return normalizeInterfaceLinks(links);
};

module.exports = {
    DEFAULT_SUPER_ADMIN_LINKS,
    normalizeInterfaceLinks,
    getEffectiveInterfaceLinks
};
