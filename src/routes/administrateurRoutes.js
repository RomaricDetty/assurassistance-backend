const express = require('express');
const router = express.Router();
const AdministrateurController = require('../controllers/administrateurController');
const authenticate = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Administrateurs
 *   description: Gestion des administrateurs et authentification
 */

/**
 * @swagger
 * /administrateurs/login:
 *   post:
 *     summary: Authentifier un administrateur
 *     tags: [Administrateurs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 example: assurassistance_user
 *               password:
 *                 type: string
 *                 format: password
 *                 example: M@nagement_123
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         token:
 *                           type: string
 *                           description: Token JWT pour l'authentification
 *                         administrateur:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               format: uuid
 *                             login:
 *                               type: string
 *                             nom:
 *                               type: string
 *       401:
 *         description: Identifiants invalides
 *       403:
 *         description: Compte désactivé
 */
router.post('/login', AdministrateurController.login);

/**
 * @swagger
 * /administrateurs:
 *   post:
 *     summary: Créer un nouvel administrateur
 *     tags: [Administrateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 example: new_admin
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: Secure@123
 *               nom:
 *                 type: string
 *                 example: Dupont
 *               prenom:
 *                 type: string
 *                 example: Jean
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jean.dupont@example.com
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Administrateur créé avec succès
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Login déjà existant
 */
router.post('/', authenticate, AdministrateurController.create);

/**
 * @swagger
 * /administrateurs:
 *   get:
 *     summary: Récupérer tous les administrateurs (paginé)
 *     tags: [Administrateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrer par statut actif
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page (max 100)
 *     responses:
 *       200:
 *         description: Liste des administrateurs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Admin'
 */
router.get('/', authenticate, AdministrateurController.getAll);

/**
 * @swagger
 * /administrateurs/me:
 *   get:
 *     summary: Récupérer le profil de l'administrateur connecté (token uniquement)
 *     tags: [Administrateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de l'administrateur connecté
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Admin'
 *       401:
 *         description: Token manquant ou invalide
 */
router.get('/me', authenticate, AdministrateurController.getProfileConnected);

/**
 * @swagger
 * /administrateurs/me:
 *   put:
 *     summary: Mettre à jour le profil de l'administrateur connecté (token uniquement)
 *     tags: [Administrateurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Profil de l'administrateur connecté mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Admin'
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Administrateur non trouvé
 *       409:
 *         description: Login déjà existant
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Compte administrateur désactivé
 */
router.put('/me', authenticate, AdministrateurController.updateProfileConnected);

/**
 * @swagger
 * /administrateurs/{id}:
 *   get:
 *     summary: Récupérer un administrateur par ID
 *     tags: [Administrateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Administrateur trouvé
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Admin'
 *       404:
 *         description: Administrateur non trouvé
 */
router.get('/:id', authenticate, AdministrateurController.getById);

/**
 * @swagger
 * /administrateurs/{id}:
 *   put:
 *     summary: Mettre à jour un administrateur
 *     tags: [Administrateurs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               login:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Administrateur mis à jour
 *       400:
 *         description: Erreur de validation
 *       404:
 *         description: Administrateur non trouvé
 *       409:
 *         description: Login déjà existant
 */
router.put('/:id', authenticate, AdministrateurController.update);

module.exports = router;
