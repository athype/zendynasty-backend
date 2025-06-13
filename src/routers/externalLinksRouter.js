const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  importMyPlayerLinks,
  importPlayerLinksForUsers,
  checkExternalApiStatus,
  previewPlayerLinksForUser
} = require('../controllers/externalLinksController');

/**
 * @swagger
 * /api/v1/external-links/import-my-links:
 *   post:
 *     summary: Import my player links from external API
 *     tags: [External Links]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Player links imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 discordId:
 *                   type: string
 *                 imported:
 *                   type: integer
 *                 players:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       playerTag:
 *                         type: string
 *                       playerName:
 *                         type: string
 *                       townHallLevel:
 *                         type: integer
 *                       isMainAccount:
 *                         type: boolean
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Not authenticated
 */
router.post('/import-my-links', authenticate, importMyPlayerLinks);

/**
 * @swagger
 * /api/v1/external-links/import-bulk:
 *   post:
 *     summary: Import player links for multiple users (Admin only)
 *     tags: [External Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               discordIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["418777941879554048", "123456789012345678"]
 *                 maxItems: 50
 *     responses:
 *       200:
 *         description: Bulk import completed
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 */
router.post('/import-bulk', authenticate, requireAdmin, importPlayerLinksForUsers);

/**
 * @swagger
 * /api/v1/external-links/preview/{discordId}:
 *   get:
 *     summary: Preview player links for a Discord ID without importing
 *     tags: [External Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: discordId
 *         required: true
 *         schema:
 *           type: string
 *         description: Discord ID to preview links for
 *     responses:
 *       200:
 *         description: Preview of player links
 *       400:
 *         description: Invalid Discord ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 */
router.get('/preview/:discordId', authenticate, requireAdmin, previewPlayerLinksForUser);

/**
 * @swagger
 * /api/v1/external-links/status:
 *   get:
 *     summary: Check external API status
 *     tags: [External Links]
 *     responses:
 *       200:
 *         description: External API status
 */
router.get('/status', checkExternalApiStatus);

module.exports = router;