const express = require('express');
const GroupeAdminController = require('../controllers/groupeAdminController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GroupesAdmin
 *   description: Gestion des groupes d'agents, cartes autorisées et création d'agents
 */

router.use(authenticate, authorizeRoles('SUPER_ADMIN'));

/**
 * @swagger
 * /groupes-admin:
 *   post:
 *     summary: Créer un groupe d'agents
 *     tags: [GroupesAdmin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Groupe créé
 */
router.post('/', GroupeAdminController.create);

/**
 * @swagger
 * /groupes-admin:
 *   get:
 *     summary: Lister les groupes d'agents
 *     tags: [GroupesAdmin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: partenaireId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filtre optionnel par partenaire
 *     responses:
 *       200:
 *         description: Liste des groupes
 */
router.get('/', GroupeAdminController.getAll);

/**
 * @swagger
 * /groupes-admin/{id}:
 *   put:
 *     summary: Mettre à jour un groupe
 *     tags: [GroupesAdmin]
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
 *         description: Groupe mis à jour
 */
router.put('/:id', GroupeAdminController.update);

/**
 * @swagger
 * /groupes-admin/{id}:
 *   delete:
 *     summary: Supprimer un groupe
 *     tags: [GroupesAdmin]
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
 *         description: Groupe supprimé
 */
router.delete('/:id', GroupeAdminController.delete);

/**
 * @swagger
 * /groupes-admin/{id}/cartes/bulk:
 *   post:
 *     summary: Ajouter un lot de cartes autorisées à un groupe
 *     tags: [GroupesAdmin]
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
 *       201:
 *         description: Cartes ajoutées
 */
router.post('/:id/cartes/bulk', GroupeAdminController.addCardsBulk);

/**
 * @swagger
 * /groupes-admin/{id}/cartes/bulk:
 *   delete:
 *     summary: Supprimer un lot de cartes d'un groupe
 *     tags: [GroupesAdmin]
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
 *         description: Cartes supprimées
 */
router.delete('/:id/cartes/bulk', GroupeAdminController.deleteCardsBulk);

/**
 * @swagger
 * /groupes-admin/{id}/cartes:
 *   get:
 *     summary: Lister les cartes autorisées d'un groupe
 *     tags: [GroupesAdmin]
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
 *         description: Liste des cartes
 */
router.get('/:id/cartes', GroupeAdminController.getCards);

/**
 * @swagger
 * /groupes-admin/{id}/agents:
 *   post:
 *     summary: Créer un utilisateur AGENT dans un groupe
 *     tags: [GroupesAdmin]
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
 *       201:
 *         description: Agent créé
 */
router.post('/:id/agents', GroupeAdminController.createAgent);

/**
 * @swagger
 * /groupes-admin/{id}/types-contrat:
 *   get:
 *     summary: Lister les types de contrat autorisés pour un groupe
 *     tags: [GroupesAdmin]
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
 *         description: Liste des types de contrat
 */
router.get('/:id/types-contrat', GroupeAdminController.getTypesContrat);

/**
 * @swagger
 * /groupes-admin/{id}/types-contrat:
 *   put:
 *     summary: Définir les types de contrat autorisés pour un groupe
 *     tags: [GroupesAdmin]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               typeContratIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Tableau vide = tous les types actifs autorisés
 *     responses:
 *       200:
 *         description: Types de contrat mis à jour
 */
router.put('/:id/types-contrat', GroupeAdminController.setTypesContrat);

module.exports = router;
