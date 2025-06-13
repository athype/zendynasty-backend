const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middlewares/auth');
const {
  linkPlayer,
  unlinkPlayer,
  getMyLinkedPlayers,
  getPlayerLinkedUser,
  getAllPlayerLinks
} = require('../controllers/playerLinksController');

/**
 * @swagger
 * /api/v1/player-links/my-players:
 *   get:
 *     summary: Get my linked players (with auto-import)
 *     tags: [Player Links]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Returns linked players for the authenticated user. If no players are found
 *       in the database, automatically attempts to import them from external API.
 *     responses:
 *       200:
 *         description: List of linked players
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 linkedPlayers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PlayerLink'
 *                 autoImport:
 *                   type: object
 *                   properties:
 *                     attempted:
 *                       type: boolean
 *                       description: Whether auto-import was attempted
 *                     imported:
 *                       type: integer
 *                       description: Number of players successfully imported
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Any errors encountered during auto-import
 *       401:
 *         description: Not authenticated
 */
router.get('/my-players', authenticate, getMyLinkedPlayers);

/**
 * @swagger
 * /api/v1/player-links/link:
 *   post:
 *     summary: Link a player to my Discord account
 *     tags: [Player Links]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               playerTag:
 *                 type: string
 *                 example: "#CLV98LRJ"
 *     responses:
 *       200:
 *         description: Player linked successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Not authenticated
 */
router.post('/link', authenticate, linkPlayer);

/**
 * @swagger
 * /api/v1/player-links/unlink/{playerTag}:
 *   delete:
 *     summary: Unlink a player from my Discord account
 *     tags: [Player Links]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playerTag
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player unlinked successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Link not found
 */
router.delete('/unlink/:playerTag', authenticate, unlinkPlayer);

/**
 * @swagger
 * /api/v1/player-links/player/{playerTag}/user:
 *   get:
 *     summary: Get Discord user linked to a player
 *     tags: [Player Links]
 *     parameters:
 *       - in: path
 *         name: playerTag
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Linked user information
 *       404:
 *         description: Player not linked to any user
 */
router.get('/player/:playerTag/user', getPlayerLinkedUser);

/**
 * @swagger
 * /api/v1/player-links/all:
 *   get:
 *     summary: Get all player links (Admin only)
 *     tags: [Player Links]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all player links
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Admin access required
 */
router.get('/all', authenticate, requireAdmin, getAllPlayerLinks);

module.exports = router;