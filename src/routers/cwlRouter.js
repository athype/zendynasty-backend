const express = require('express');
const router = express.Router();
const {
  getCWLPerformance,
  getSeasonSummary,
  getMissedAttacks,
  getAllSeasons,
  getCurrentSeason,
  getPlayerByTag,
  getPlayerCWLParticipation
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
 */
router.get('/current', getCurrentSeason);

/**
 * @swagger
 * /api/v1/cwl/player/{playerTag}:
 *   get:
 *     summary: Get player information by tag
 *     tags: [CWL]
 *     parameters:
 *       - in: path
 *         name: playerTag
 *         required: true
 *         schema:
 *           type: string
 *         description: Player tag (e.g., #CLV98LRJ)
 *     responses:
 *       200:
 *         description: Player information
 *       404:
 *         description: Player not found
 */
router.get('/player/:playerTag', getPlayerByTag);

/**
 * @swagger
 * /api/v1/cwl/player/{playerTag}/participation/{year}/{month}:
 *   get:
 *     summary: Get player CWL participation for specific season
 *     tags: [CWL]
 *     parameters:
 *       - in: path
 *         name: playerTag
 *         required: true
 *         schema:
 *           type: string
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
 *     responses:
 *       200:
 *         description: Player participation data
 *       404:
 *         description: Participation not found
 */
router.get('/player/:playerTag/participation/:year/:month', getPlayerCWLParticipation);

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
 *       - in: path
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: CWL performance data
 */
router.get('/performance/:year/:month', getCWLPerformance);

/**
 * @swagger
 * /api/v1/cwl/summary/{year}/{month}:
 *   get:
 *     summary: Get season summary per player
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
 *     responses:
 *       200:
 *         description: Missed attacks data
 */
router.get('/missed/:year/:month', getMissedAttacks);

module.exports = router;