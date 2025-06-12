const database = require('../dataUtils/dbInit');

class CWLDataService {
  
  async createOrUpdatePlayer(playerData) {
    const { player_tag, player_name, town_hall_level } = playerData;
    
    try {
      // First, try to get existing player by tag
      const existingPlayer = await database.query(
        `SELECT player_id, town_hall_level, player_name FROM players WHERE player_tag = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [player_tag]
      );
      
      if (existingPlayer.rows && existingPlayer.rows.length > 0) {
        const currentPlayer = existingPlayer.rows[0];
        
        // Update player if town hall level increased or name changed
        if (town_hall_level > currentPlayer.town_hall_level || player_name !== currentPlayer.player_name) {
          await database.query(
            `UPDATE players SET player_name = ${database.type === 'postgresql' ? '$1' : '?'}, town_hall_level = ${database.type === 'postgresql' ? '$2' : '?'}, last_updated = ${database.type === 'postgresql' ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP'} WHERE player_tag = ${database.type === 'postgresql' ? '$3' : '?'}`,
            [player_name, town_hall_level, player_tag]
          );
          
          if (town_hall_level > currentPlayer.town_hall_level) {
            console.log(`Updated ${player_name} (${player_tag}) TH level from ${currentPlayer.town_hall_level} to ${town_hall_level}`);
          }
          if (player_name !== currentPlayer.player_name) {
            console.log(`Updated player name from ${currentPlayer.player_name} to ${player_name} (${player_tag})`);
          }
        }
        
        return currentPlayer.player_id;
      } else {
        // Create new player
        const result = await database.query(
          `INSERT INTO players (player_tag, player_name, town_hall_level) VALUES (${database.type === 'postgresql' ? '$1, $2, $3' : '?, ?, ?'}) ${database.type === 'postgresql' ? 'RETURNING player_id' : ''}`,
          [player_tag, player_name, town_hall_level]
        );
        
        const playerId = database.type === 'postgresql' ? result.rows[0].player_id : result.insertId;
        console.log(`Created new player: ${player_name} (${player_tag})`);
        return playerId;
      }
    } catch (error) {
      console.error(`Error creating/updating player ${player_name} (${player_tag}):`, error);
      throw error;
    }
  }
  
  async setCWLParticipation(playerData, seasonData, bonusEligible = false) {
    const { player_tag } = playerData;
    const { season_year, season_month } = seasonData;
    
    try {
      // Get player ID
      const playerResult = await database.query(
        `SELECT player_id FROM players WHERE player_tag = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [player_tag]
      );
      
      if (!playerResult.rows || playerResult.rows.length === 0) {
        throw new Error(`Player with tag ${player_tag} not found`);
      }
      
      const player_id = playerResult.rows[0].player_id;
      
      // Get season ID
      const seasonResult = await database.query(
        `SELECT season_id FROM cwl_seasons WHERE season_year = ${database.type === 'postgresql' ? '$1' : '?'} AND season_month = ${database.type === 'postgresql' ? '$2' : '?'}`,
        [season_year, season_month]
      );
      
      if (!seasonResult.rows || seasonResult.rows.length === 0) {
        throw new Error(`Season ${season_year}-${season_month} not found`);
      }
      
      const season_id = seasonResult.rows[0].season_id;
      
      // Insert or update participation
      if (database.type === 'postgresql') {
        await database.query(
          `INSERT INTO cwl_participation (player_id, season_id, bonus_eligible) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (player_id, season_id) 
           DO UPDATE SET bonus_eligible = EXCLUDED.bonus_eligible`,
          [player_id, season_id, bonusEligible]
        );
      } else {
        await database.query(
          `INSERT OR REPLACE INTO cwl_participation (player_id, season_id, bonus_eligible) 
           VALUES (?, ?, ?)`,
          [player_id, season_id, bonusEligible]
        );
      }
      
      console.log(`Set CWL participation for ${player_tag} in ${season_year}-${season_month}, bonus eligible: ${bonusEligible}`);
    } catch (error) {
      console.error(`Error setting CWL participation for ${player_tag}:`, error);
      throw error;
    }
  }
  
  async getPlayerByTag(player_tag) {
    try {
      const result = await database.query(
        `SELECT player_id, player_tag, player_name, town_hall_level FROM players WHERE player_tag = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [player_tag]
      );
      
      return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting player by tag ${player_tag}:`, error);
      throw error;
    }
  }
  
  async getPlayerCWLParticipation(player_tag, season_year, season_month) {
    try {
      const result = await database.query(
        `SELECT cp.bonus_eligible, p.player_tag, p.player_name 
         FROM cwl_participation cp
         JOIN players p ON cp.player_id = p.player_id
         JOIN cwl_seasons cs ON cp.season_id = cs.season_id
         WHERE p.player_tag = ${database.type === 'postgresql' ? '$1' : '?'} 
         AND cs.season_year = ${database.type === 'postgresql' ? '$2' : '?'} 
         AND cs.season_month = ${database.type === 'postgresql' ? '$3' : '?'}`,
        [player_tag, season_year, season_month]
      );
      
      return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting CWL participation for ${player_tag}:`, error);
      throw error;
    }
  }
  
  async getAllSeasons() {
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

      return result.rows || [];
    } catch (error) {
      console.error('Error getting all seasons:', error);
      throw error;
    }
  }
  
  async createSeason(season_year, season_month) {
    try {
      // Check if season exists
      const existingSeason = await database.query(
        `SELECT season_id FROM cwl_seasons WHERE season_year = ${database.type === 'postgresql' ? '$1' : '?'} AND season_month = ${database.type === 'postgresql' ? '$2' : '?'}`,
        [season_year, season_month]
      );
      
      if (existingSeason.rows && existingSeason.rows.length > 0) {
        return existingSeason.rows[0].season_id;
      }
      
      // Create new season
      const result = await database.query(
        `INSERT INTO cwl_seasons (season_year, season_month) VALUES (${database.type === 'postgresql' ? '$1, $2' : '?, ?'}) ${database.type === 'postgresql' ? 'RETURNING season_id' : ''}`,
        [season_year, season_month]
      );
      
      const seasonId = database.type === 'postgresql' ? result.rows[0].season_id : result.insertId;
      console.log(`Created new season: ${season_year}-${season_month}`);
      return seasonId;
    } catch (error) {
      console.error(`Error creating season ${season_year}-${season_month}:`, error);
      throw error;
    }
  }
  
  async createWarDay(season_id, day_number) {
    try {
      // Check if war day exists
      const existingWarDay = await database.query(
        `SELECT war_day_id FROM war_days WHERE season_id = ${database.type === 'postgresql' ? '$1' : '?'} AND day_number = ${database.type === 'postgresql' ? '$2' : '?'}`,
        [season_id, day_number]
      );
      
      if (existingWarDay.rows && existingWarDay.rows.length > 0) {
        return existingWarDay.rows[0].war_day_id;
      }
      
      // Create new war day
      const result = await database.query(
        `INSERT INTO war_days (season_id, day_number) VALUES (${database.type === 'postgresql' ? '$1, $2' : '?, ?'}) ${database.type === 'postgresql' ? 'RETURNING war_day_id' : ''}`,
        [season_id, day_number]
      );
      
      const warDayId = database.type === 'postgresql' ? result.rows[0].war_day_id : result.insertId;
      return warDayId;
    } catch (error) {
      console.error(`Error creating war day ${day_number} for season ${season_id}:`, error);
      throw error;
    }
  }
  
  async addPlayerAttack(attackData) {
    const { player_tag, day_number, stars_earned, destruction_percentage, enemy_town_hall_level, season_year, season_month } = attackData;
    
    try {
      // Get player ID by tag
      const playerResult = await database.query(
        `SELECT player_id FROM players WHERE player_tag = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [player_tag]
      );
      
      if (!playerResult || !playerResult.rows || playerResult.rows.length === 0) {
        throw new Error(`Player with tag ${player_tag} not found`);
      }
      
      const player_id = playerResult.rows[0].player_id;
      
      // Get season ID
      const seasonResult = await database.query(
        `SELECT season_id FROM cwl_seasons WHERE season_year = ${database.type === 'postgresql' ? '$1' : '?'} AND season_month = ${database.type === 'postgresql' ? '$2' : '?'}`,
        [season_year, season_month]
      );
      
      if (!seasonResult.rows || seasonResult.rows.length === 0) {
        throw new Error(`Season ${season_year}-${season_month} not found`);
      }
      
      const season_id = seasonResult.rows[0].season_id;
      
      // Get war day ID
      const warDayResult = await database.query(
        `SELECT war_day_id FROM war_days WHERE season_id = ${database.type === 'postgresql' ? '$1' : '?'} AND day_number = ${database.type === 'postgresql' ? '$2' : '?'}`,
        [season_id, day_number]
      );
      
      if (!warDayResult.rows || warDayResult.rows.length === 0) {
        throw new Error(`War day ${day_number} for season ${season_year}-${season_month} not found`);
      }
      
      const war_day_id = warDayResult.rows[0].war_day_id;
      
      // Insert attack record
      const result = await database.query(
        `INSERT INTO player_attacks (player_id, war_day_id, stars_earned, destruction_percentage, enemy_town_hall_level) VALUES (${database.type === 'postgresql' ? '$1, $2, $3, $4, $5' : '?, ?, ?, ?, ?'}) ${database.type === 'postgresql' ? 'RETURNING attack_id' : ''}`,
        [player_id, war_day_id, stars_earned, destruction_percentage, enemy_town_hall_level]
      );
      
      const attackId = database.type === 'postgresql' ? result.rows[0].attack_id : result.insertId;
      return attackId;
    } catch (error) {
      console.error(`Error adding attack for player ${player_tag}:`, error);
      throw error;
    }
  }
}

module.exports = new CWLDataService();