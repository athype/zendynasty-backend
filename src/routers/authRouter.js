const express = require('express');
const passport = require('../config/passport');
const { authenticate } = require('../middlewares/auth');
const {
  discordCallback,
  getProfile,
  logout
} = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/discord:
 *   get:
 *     summary: Initiate Discord OAuth authentication
 *     tags: [Authentication]
 *     description: Redirects user to Discord OAuth flow
 *     responses:
 *       302:
 *         description: Redirect to Discord OAuth
 */
router.get('/discord', passport.authenticate('discord'));

/**
 * @swagger
 * /api/v1/auth/discord/callback:
 *   get:
 *     summary: Discord OAuth callback
 *     tags: [Authentication]
 *     description: Handles Discord OAuth callback and returns JWT token
 *     responses:
 *       302:
 *         description: Redirect to frontend with JWT token
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/auth/failure' }), discordCallback);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 */
router.get('/profile', authenticate, getProfile);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/logout', logout);

/**
 * @swagger
 * /api/v1/auth/failure:
 *   get:
 *     summary: Authentication failure endpoint
 *     tags: [Authentication]
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

module.exports = router;