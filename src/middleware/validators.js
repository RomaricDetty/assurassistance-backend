const { body, validationResult } = require('express-validator');

/**
 * Middleware pour valider les données de SiteCategory
 */
const validateSiteCategory = [
    body('libelle')
        .trim()
        .notEmpty()
        .withMessage('Le libellé est requis')
        .isLength({ min: 2, max: 100 })
        .withMessage('Le libellé doit contenir entre 2 et 100 caractères'),

    body('description')
        .optional()
        .trim(),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive doit être un booléen'),

    // Middleware pour traiter les erreurs de validation
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Middleware pour valider les données de Category
 */
const validateCategory = [
    body('libelle')
        .trim()
        .notEmpty()
        .withMessage('Le libellé est requis')
        .isLength({ min: 2, max: 100 })
        .withMessage('Le libellé doit contenir entre 2 et 100 caractères'),

    body('idSiteCategory')
        .notEmpty()
        .withMessage('L\'ID de la catégorie principale est requis')
        .isUUID()
        .withMessage('L\'ID de la catégorie principale doit être un UUID valide'),

    body('description')
        .optional()
        .trim(),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive doit être un booléen'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Middleware pour valider les données de Marque
 */
const validateMarque = [
    body('libelle')
        .trim()
        .notEmpty()
        .withMessage('Le libellé est requis')
        .isLength({ min: 2, max: 100 })
        .withMessage('Le libellé doit contenir entre 2 et 100 caractères'),

    body('idSiteCategory')
        .notEmpty()
        .withMessage('L\'ID de la catégorie principale est requis')
        .isUUID()
        .withMessage('L\'ID de la catégorie principale doit être un UUID valide'),

    body('description')
        .optional()
        .trim(),

    body('logo')
        .optional()
        .trim(),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive doit être un booléen'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Middleware pour valider les données de Produit
 */
const validateProduit = [
    body('libelle')
        .trim()
        .notEmpty()
        .withMessage('Le libellé est requis')
        .isLength({ min: 2, max: 200 })
        .withMessage('Le libellé doit contenir entre 2 et 200 caractères'),

    body('idMarque')
        .notEmpty()
        .withMessage('L\'ID de la marque est requis')
        .isUUID()
        .withMessage('L\'ID de la marque doit être un UUID valide'),

    // body('idCategory')
    //     .notEmpty()
    //     .withMessage('L\'ID de la catégorie est requis')
    //     .isUUID()
    //     .withMessage('L\'ID de la catégorie doit être un UUID valide'),

    body('quantite_minimale')
        .notEmpty()
        .withMessage('La quantité minimale est requise')
        .isInt({ min: 1 })
        .withMessage('La quantité minimale doit être au moins 1'),

    body('prix')
        .optional()
        .isDecimal()
        .withMessage('Le prix doit être un nombre décimal')
        .custom((value) => value >= 0)
        .withMessage('Le prix ne peut pas être négatif'),

    body('quantite_stock')
        .notEmpty()
        .withMessage('La quantité en stock est requise')
        .isInt({ min: 0 })
        .withMessage('La quantité en stock ne peut pas être négative'),

    body('description')
        .optional()
        .trim(),

    body('reference')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('La référence ne peut pas dépasser 50 caractères'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Middleware pour valider les données de DemandeDevis
 */
const validateDemandeDevis = [
    body('idProduit')
        .notEmpty()
        .withMessage('L\'ID du produit est requis')
        .isUUID()
        .withMessage('L\'ID du produit doit être un UUID valide'),

    body('nomClient')
        .trim()
        .notEmpty()
        .withMessage('Le nom du client est requis')
        .isLength({ min: 2, max: 100 })
        .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

    body('emailClient')
        .trim()
        .notEmpty()
        .withMessage('L\'email est requis')
        .isEmail()
        .withMessage('Email invalide'),

    body('telephoneClient')
        .trim()
        .notEmpty()
        .withMessage('Le téléphone est requis'),

    body('quantiteDemandee')
        .notEmpty()
        .withMessage('La quantité demandée est requise')
        .isInt({ min: 1 })
        .withMessage('La quantité demandée doit être au moins 1'),

    body('entrepriseClient')
        .optional()
        .trim(),

    body('message')
        .optional()
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: errors.array()
            });
        }
        next();
    }
];

/**
 * Middleware pour valider les données de Commande
 */
const validateCommande = [
    body('idProduit')
        .notEmpty()
        .withMessage('L\'ID du produit est requis')
        .isUUID()
        .withMessage('L\'ID du produit doit être un UUID valide'),

    body('quantiteCommande')
        .notEmpty()
        .withMessage('La quantité commandée est requise')
        .isInt({ min: 1 })
        .withMessage('La quantité commandée doit être au moins 1'),

    body('lieuLivraison')
        .trim()
        .notEmpty()
        .withMessage('Le lieu de livraison est requis'),

    body('nomClient')
        .trim()
        .notEmpty()
        .withMessage('Le nom du client est requis'),

    body('emailClient')
        .trim()
        .notEmpty()
        .withMessage('L\'email est requis')
        .isEmail()
        .withMessage('Email invalide'),

    body('telephoneClient')
        .trim()
        .notEmpty()
        .withMessage('Le téléphone est requis'),

    body('prixUnitaire')
        .notEmpty()
        .withMessage('Le prix unitaire est requis')
        .isDecimal()
        .withMessage('Le prix unitaire doit être un nombre décimal'),

    body('adresseComplete')
        .optional()
        .trim(),

    body('noteClient')
        .optional()
        .trim(),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Erreur de validation',
                errors: errors.array()
            });
        }
        next();
    }
];

module.exports = {
    validateSiteCategory,
    validateCategory,
    validateMarque,
    validateProduit,
    validateDemandeDevis,
    validateCommande
};