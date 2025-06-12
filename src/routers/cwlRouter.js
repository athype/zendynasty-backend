const express = require('express');
const router = express.Router();
const middlewares = require('../middlewares');
const {
  getCWLPerformance,
  getSeasonSummary,
  getMissedAttacks,
  getAllSeasons,
  getCurrentSeason
} = require('../controllers/cwlController');

/**
 * @swagger
 * /api/v1/cwl/seasons:
 *   get:
 *     summary: Get all CWL seasons
 *     tags: [CWL]
 *     responses:
 *       200:
 *         description: List of all seasons
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 seasons:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Season'
 *                       - type: object
 *                         properties:
 *                           total_players:
 *                             type: integer
 *                           total_attacks:
 *                             type: integer
 */
router.get('/seasons', getAllSeasons);

/**
 * @swagger
 * /api/v1/cwl/current:
 *   get:
 *     summary: Get current season data
 *     tags: [CWL]
 *     responses:
 *       200:
 *         description: Current season comprehensive data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 season:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PlayerAttack'
 *                     summary:
 *                       type: array
 *                     missedAttacks:
 *                       type: array
 */
router.get('/current', getCurrentSeason);

/**
 * @swagger
 * /api/v1/cwl/performance/{year}/{month}:
 *   get:
 *     summary: Get CWL performance for specific season
 *     tags: [CWL]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Season year
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: Season month
 *     responses:
 *       200:
 *         description: Performance data for the season
 *       400:
 *         description: Invalid year or month
 */
router.get('/performance/:year/:month', getCWLPerformance);

/**
 * @swagger
 * /api/v1/cwl/summary/{year}/{month}:
 *   get:
 *     summary: Get season summary for specific season
 *     tags: [CWL]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Season summary data
 */
router.get('/summary/:year/:month', getSeasonSummary);

/**
 * @swagger
 * /api/v1/cwl/missed/{year}/{month}:
 *   get:
 *     summary: Get missed attacks for specific season
 *     tags: [CWL]
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Missed attacks data
 */
router.get('/missed/:year/:month', getMissedAttacks);

module.exports = router;