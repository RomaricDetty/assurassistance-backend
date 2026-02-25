const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/clientController');
const authenticate = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestion des clients
 */

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Créer un nouveau client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nomClient
 *               - prenomClient
 *               - idCarteBancaire
 *               - typeContrat
 *             properties:
 *               nomClient:
 *                 type: string
 *                 example: Dupont
 *               prenomClient:
 *                 type: string
 *                 example: Jean
 *               idCarteBancaire:
 *                 type: string
 *                 example: 1234567890
 *               typeContrat:
 *                 type: string
 *                 example: Business
 *     responses:
 *       201:
 *         description: Client créé avec succès
 *       400:
 *         description: Erreur de validation
 *       409:
 *         description: Client déjà existant
 *       401:
 *         description: Token manquant ou invalide
 *       403:
 *         description: Accès refusé
 */
 router.post('/', authenticate, ClientController.create);

/**
 * @swagger
 * /clients/bulk:
 *   post:
 *     summary: Créer plusieurs clients en une requête
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clients]
 *             properties:
 *               clients:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [nomClient, prenomClient, idCarteBancaire, typeContrat]
 *                   properties:
 *                     nomClient: { type: string }
 *                     prenomClient: { type: string }
 *                     idCarteBancaire: { type: string }
 *                     typeContrat: { type: string, enum: [Business, Platinum, Premier] }
 *     responses:
 *       201:
 *         description: Import terminé (créés + réactivés), meta.conflicts si doublons actifs
 *       400:
 *         description: Tableau vide ou champ manquant / typeContrat invalide
 *       401:
 *         description: Token manquant ou invalide
 */
 router.post('/bulk', authenticate, ClientController.createMany);


 /**
  * @swagger
  * /clients:
  *   get:
  *     summary: Récupérer tous les clients (paginé)
  *     tags: [Clients]
  *     security:
  *       - bearerAuth: []
  *     parameters:
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
  *         description: Clients récupérés avec succès
  *       401:
  *         description: Token manquant ou invalide
  *       403:
  *         description: Accès refusé
  */
 router.get('/', authenticate, ClientController.getAll);


 /**
  * @swagger
  * /clients/{id}:
  *   get:
  *     summary: Récupérer un client par ID
  *     tags: [Clients]
  *     security:
  *       - bearerAuth: []
  *     responses:
  *       200:
  *         description: Client récupéré avec succès
  *       404:
  *         description: Client non trouvé
  *       401:
  *         description: Token manquant ou invalide
  *       403:
  *         description: Accès refusé
  */
 router.get('/:id', authenticate, ClientController.getById);


 /**
  * @swagger
  * /clients/{id}:
  *   put:
  *     summary: Mettre à jour un client
  *     tags: [Clients]
  *     security:
  *       - bearerAuth: []
  *     responses:
  *       200:
  *         description: Client mis à jour avec succès
  *       404:
  *         description: Client non trouvé
  *       401:
  *         description: Token manquant ou invalide
  *       403:
  *         description: Accès refusé
  */
 router.put('/:id', authenticate, ClientController.update);

 /**
  * @swagger
  * /clients/{id}:
  *   delete:
  *     summary: Supprimer un client
  *     tags: [Clients]
  *     security:
  *       - bearerAuth: []
  *     responses:
  *       200:
  *         description: Client supprimé avec succès
  *       404:
  *         description: Client non trouvé
  *       401:
  *         description: Token manquant ou invalide
  *       403:
  *         description: Accès refusé
  */
 router.delete('/:id', authenticate, ClientController.delete);

 module.exports = router;