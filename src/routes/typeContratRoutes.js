const express = require('express');
const TypeContratController = require('../controllers/typeContratController');
const authenticate = require('../middleware/auth');
const authorizeRoles = require('../middleware/authorizeRoles');
const { uploadContratPdf } = require('../middleware/uploadPdf');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: TypesContrat
 *   description: Gestion dynamique des types de contrat et PDF associés
 */

router.use(authenticate, authorizeRoles('SUPER_ADMIN'));

/**
 * @swagger
 * /types-contrat:
 *   get:
 *     summary: Lister les types de contrat
 *     tags: [TypesContrat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Liste des types de contrat
 */
router.get('/', TypeContratController.getAll);

/**
 * @swagger
 * /types-contrat/{id}:
 *   get:
 *     summary: Récupérer un type de contrat
 *     tags: [TypesContrat]
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
 *         description: Type de contrat trouvé
 */
router.get('/:id', TypeContratController.getById);

/**
 * @swagger
 * /types-contrat:
 *   post:
 *     summary: Créer un type de contrat (multipart avec champ pdf optionnel)
 *     tags: [TypesContrat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [code, libelle]
 *             properties:
 *               code: { type: string, example: Business }
 *               libelle: { type: string, example: Contrat Business }
 *               description: { type: string }
 *               ordre: { type: integer, example: 1 }
 *               isActive: { type: boolean, default: true }
 *               pdf: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Type de contrat créé
 */
router.post('/', uploadContratPdf, TypeContratController.create);

/**
 * @swagger
 * /types-contrat/{id}:
 *   put:
 *     summary: Mettre à jour un type de contrat (PDF optionnel)
 *     tags: [TypesContrat]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               libelle: { type: string }
 *               description: { type: string }
 *               ordre: { type: integer }
 *               isActive: { type: boolean }
 *               pdf: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Type de contrat mis à jour
 */
router.put('/:id', uploadContratPdf, TypeContratController.update);

/**
 * @swagger
 * /types-contrat/{id}:
 *   delete:
 *     summary: Supprimer un type de contrat
 *     tags: [TypesContrat]
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
 *         description: Type de contrat supprimé
 */
router.delete('/:id', TypeContratController.delete);

module.exports = router;
