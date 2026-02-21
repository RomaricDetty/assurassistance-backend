const express = require('express');
const router = express.Router();

// Importer toutes les routes
const administrateurRoutes = require('../routes/administrateurRoutes');


// Routes pour les administrateurs
router.use('/administrateurs', administrateurRoutes);

/**
 * @swagger
 * /health-check:
 *   get:
 *     summary: Vérifier l'état de santé de l'API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API fonctionnelle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: API Assur\'Assistance Backend fonctionnelle
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health-check', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API Assur\'Assistance Backend fonctionnelle',
        timestamp: new Date().toISOString()
    });
});


/**
 * @swagger
 * /:
 *   get:
 *     summary: Route par défaut (404)
 *     tags: [404 Error]
 *     responses:
 *       404:
 *         description: Route non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Route non trouvée
 *                 path:
 *                   type: string
 *                   example: /api/non-existent-route
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.use((req, res) => {
    res.status(404).json({
            success: false,
            message: 'Route non trouvée',
            path: req.originalUrl,
            timestamp: new Date().toISOString()
        });
    }
);

module.exports = router;