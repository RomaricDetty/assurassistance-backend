const express = require('express');
const PartenaireController = require('../controllers/partenaireController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Partenaires
 *   description: Gestion des partenaires
 */

router.use(authenticate, authorizeRoles('SUPER_ADMIN'));

/**
 * @swagger
 * /partenaires:
 *   post:
 *     summary: Créer un partenaire
 *     tags: [Partenaires]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom]
 *             properties:
 *               nom: { type: string, example: Partenaire Alpha }
 *               contact: { type: string, example: "+2250102030405" }
 *               adresse: { type: string, example: Abidjan, Cocody }
 *               isActive: { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Partenaire créé
 */
router.post('/', PartenaireController.create);

/**
 * @swagger
 * /partenaires:
 *   get:
 *     summary: Lister les partenaires
 *     tags: [Partenaires]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des partenaires
 */
router.get('/', PartenaireController.getAll);

/**
 * @swagger
 * /partenaires/{id}:
 *   put:
 *     summary: Mettre à jour un partenaire
 *     tags: [Partenaires]
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
 *         description: Partenaire mis à jour
 */
router.put('/:id', PartenaireController.update);

/**
 * @swagger
 * /partenaires/{id}:
 *   delete:
 *     summary: Supprimer un partenaire
 *     tags: [Partenaires]
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
 *         description: Partenaire supprimé
 */
router.delete('/:id', PartenaireController.delete);

module.exports = router;
