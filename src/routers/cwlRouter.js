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

// Get all seasons
router.get('/seasons', getAllSeasons);

// Get current season data (all metrics)
router.get('/current', getCurrentSeason);

// Get CWL performance for specific season
router.get('/performance/:year/:month', getCWLPerformance);

// Get season summary for specific season
router.get('/summary/:year/:month', getSeasonSummary);

// Get missed attacks for specific season
router.get('/missed/:year/:month', getMissedAttacks);

module.exports = router;