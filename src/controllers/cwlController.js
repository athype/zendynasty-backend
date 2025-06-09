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
    const result = await database.query(`
      SELECT 
        season_year,
        season_month,
        COUNT(DISTINCT p.player_id) as total_players,
        COUNT(pa.attack_id) as total_attacks
      FROM cwl_seasons cs
      LEFT JOIN war_days wd ON cs.season_id = wd.season_id
      LEFT JOIN player_attacks pa ON wd.war_day_id = pa.war_day_id
      LEFT JOIN players p ON pa.player_id = p.player_id
      GROUP BY cs.season_id, cs.season_year, cs.season_month
      ORDER BY cs.season_year DESC, cs.season_month DESC
    `);

    res.json({
      seasons: result.rows || []
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

module.exports = {
  getCWLPerformance,
  getSeasonSummary,
  getMissedAttacks,
  getAllSeasons,
  getCurrentSeason
};