const fs = require('fs');
const CWLDataParser = require('../services/csvParser');
const CWLDataService = require('../services/cwlDataService');

const uploadCWLData = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No CSV file uploaded'
      });
    }

    const { season_year, season_month } = req.body;
    
    if (!season_year || !season_month) {
      return res.status(400).json({
        error: 'Season year and month are required'
      });
    }

    const parser = new CWLDataParser();
    const dataService = new CWLDataService();

    // Read and parse the CSV file
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const parsedData = parser.parseSpecificFormat(csvContent, parseInt(season_year), parseInt(season_month));

    // Process the data into the database
    const result = await dataService.processCWLData(parsedData);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'CWL data uploaded successfully',
      season: `${season_year}-${season_month}`,
      ...result
    });

  } catch (error) {
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const getUploadHistory = async (req, res, next) => {
  try {
    const database = require('../dataUtils/dbInit');
    
    const result = await database.query(`
      SELECT 
        cs.season_year,
        cs.season_month,
        COUNT(DISTINCT p.player_id) as players_count,
        COUNT(pa.attack_id) as attacks_count,
        MAX(pa.attack_id) as last_upload_indicator
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

module.exports = {
  uploadCWLData,
  getUploadHistory
};