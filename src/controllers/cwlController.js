const cwlDataService = require('../services/cwlDataService');
const database = require('../dataUtils/dbInit');
const {
  GET_CWL_PERFORMANCE_CURRENT_SEASON,
  GET_SEASON_SUMMARY_PER_PLAYER,
  GET_MISSED_ATTACKS
} = require('../dataUtils/dbQueries');

const getCWLPerformance = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({
        error: 'Season year and month are required'
      });
    }

    const result = await database.query(GET_CWL_PERFORMANCE_CURRENT_SEASON, [parseInt(year), parseInt(month)]);
    
    res.json({
      season: `${year}-${month}`,
      performance: result.rows || []
    });
  } catch (error) {
    next(error);
  }
};

const getSeasonSummary = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({
        error: 'Season year and month are required'
      });
    }

    const result = await database.query(GET_SEASON_SUMMARY_PER_PLAYER, [parseInt(year), parseInt(month)]);
    
    res.json({
      season: `${year}-${month}`,
      summary: result.rows || []
    });
  } catch (error) {
    next(error);
  }
};

const getMissedAttacks = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month) {
      return res.status(400).json({
        error: 'Season year and month are required'
      });
    }

    const result = await database.query(GET_MISSED_ATTACKS, [parseInt(year), parseInt(month)]);
    
    res.json({
      season: `${year}-${month}`,
      missedAttacks: result.rows || []
    });
  } catch (error) {
    next(error);
  }
};

const getAllSeasons = async (req, res, next) => {
  try {
    const seasons = await cwlDataService.getAllSeasons();
    
    res.json({
      seasons: seasons || []
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentSeason = async (req, res, next) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    // Get current season data
    const [performance, summary, missed] = await Promise.all([
      database.query(GET_CWL_PERFORMANCE_CURRENT_SEASON, [currentYear, currentMonth]),
      database.query(GET_SEASON_SUMMARY_PER_PLAYER, [currentYear, currentMonth]),
      database.query(GET_MISSED_ATTACKS, [currentYear, currentMonth])
    ]);

    res.json({
      season: `${currentYear}-${currentMonth}`,
      data: {
        performance: performance.rows || [],
        summary: summary.rows || [],
        missedAttacks: missed.rows || []
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPlayerByTag = async (req, res, next) => {
  try {
    const { playerTag } = req.params;
    
    if (!playerTag) {
      return res.status(400).json({
        error: 'Player tag is required'
      });
    }

    const player = await cwlDataService.getPlayerByTag(playerTag);
    
    if (!player) {
      return res.status(404).json({
        error: 'Player not found'
      });
    }

    res.json({
      player
    });
  } catch (error) {
    next(error);
  }
};

const getPlayerCWLParticipation = async (req, res, next) => {
  try {
    const { playerTag, year, month } = req.params;
    
    if (!playerTag || !year || !month) {
      return res.status(400).json({
        error: 'Player tag, year, and month are required'
      });
    }

    const participation = await cwlDataService.getPlayerCWLParticipation(
      playerTag, 
      parseInt(year), 
      parseInt(month)
    );
    
    if (!participation) {
      return res.status(404).json({
        error: 'Player participation not found for this season'
      });
    }

    res.json({
      season: `${year}-${month}`,
      participation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCWLPerformance,
  getSeasonSummary,
  getMissedAttacks,
  getAllSeasons,
  getCurrentSeason,
  getPlayerByTag,
  getPlayerCWLParticipation
};