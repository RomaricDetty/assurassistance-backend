const express = require('express');
const GroupeAdminController = require('../controllers/groupeAdminController');
const authenticate = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: GroupesPartner
 *   description: Consultation des clients par groupe (agents et super admin)
 */

router.use(authenticate);

/**
 * @swagger
 * /groupes-partner/{id}/clients:
 *   get:
 *     summary: Lister les clients rattachés aux cartes autorisées d'un groupe
 *     tags: [GroupesPartner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Liste paginée des clients
 *       403:
 *         description: Accès refusé pour un agent hors de son groupe
 *       404:
 *         description: Groupe non trouvé
 */
router.get('/:id/clients', GroupeAdminController.getClients);

/**
 * @swagger
 * /groupes-partner/{id}/types-contrat:
 *   get:
 *     summary: Lister les types de contrat disponibles pour un groupe (agents)
 *     tags: [GroupesPartner]
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
 *         description: Types de contrat avec PDF associés
 */
router.get('/:id/types-contrat', GroupeAdminController.getTypesContrat);

module.exports = router;
