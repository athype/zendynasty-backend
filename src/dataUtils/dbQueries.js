const database = require('./dbInit');

// Helper function to get parameter placeholder
const getParamPlaceholder = (index) => {
  return database.type === 'postgresql' ? `$${index}` : '?';
};

// Get complete CWL performance for current season
const GET_CWL_PERFORMANCE_CURRENT_SEASON = `
  SELECT 
    player_name,
    town_hall_level,
    bonus_eligible,
    day_number,
    stars_earned,
    destruction_percentage,
    enemy_town_hall_level
  FROM cwl_performance_summary 
  WHERE season_year = ${getParamPlaceholder(1)} AND season_month = ${getParamPlaceholder(2)}
  ORDER BY day_number, player_name;
`;

// Season summary per player
const GET_SEASON_SUMMARY_PER_PLAYER = `
  SELECT 
    p.player_name,
    p.town_hall_level,
    p.bonus_eligible,
    COUNT(pa.attack_id) as attacks_made,
    SUM(pa.stars_earned) as total_stars,
    ROUND(AVG(pa.destruction_percentage), 2) as avg_destruction,
    ROUND(AVG(pa.stars_earned), 2) as avg_stars
  FROM players p
  LEFT JOIN player_attacks pa ON p.player_id = pa.player_id
  LEFT JOIN war_days wd ON pa.war_day_id = wd.war_day_id
  LEFT JOIN cwl_seasons cs ON wd.season_id = cs.season_id
  WHERE cs.season_year = ${getParamPlaceholder(1)} AND cs.season_month = ${getParamPlaceholder(2)}
  GROUP BY p.player_id, p.player_name, p.town_hall_level, p.bonus_eligible
  ORDER BY total_stars DESC;
`;

// Find missed attacks
const GET_MISSED_ATTACKS = `
  SELECT 
    p.player_name,
    7 - COUNT(pa.attack_id) as missed_attacks
  FROM players p
  LEFT JOIN player_attacks pa ON p.player_id = pa.player_id
  LEFT JOIN war_days wd ON pa.war_day_id = wd.war_day_id
  LEFT JOIN cwl_seasons cs ON wd.season_id = cs.season_id
  WHERE cs.season_year = ${getParamPlaceholder(1)} AND cs.season_month = ${getParamPlaceholder(2)}
  GROUP BY p.player_id, p.player_name
  HAVING COUNT(pa.attack_id) < 7
  ORDER BY missed_attacks DESC;
`;

module.exports = {
  GET_CWL_PERFORMANCE_CURRENT_SEASON,
  GET_SEASON_SUMMARY_PER_PLAYER,
  GET_MISSED_ATTACKS
};