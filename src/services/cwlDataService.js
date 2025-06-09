const database = require('../dataUtils/dbInit');

class CWLDataService {
  
  async createOrUpdatePlayer(playerData) {
    const { player_name, town_hall_level, bonus_eligible } = playerData;
    
    try {
      // First, try to get existing player
      const existingPlayer = await database.query(
        `SELECT player_id, town_hall_level FROM players WHERE player_name = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [player_name]
      );
      
      if (existingPlayer.rows && existingPlayer.rows.length > 0) {
        const currentPlayer = existingPlayer.rows[0];
        
        // Update town hall level if it's higher (player upgraded)
        if (town_hall_level > currentPlayer.town_hall_level) {
          await database.query(
            `UPDATE players SET town_hall_level = ${database.type === 'postgresql' ? '$1' : '?'}, bonus_eligible = ${database.type === 'postgresql' ? '$2' : '?'} WHERE player_name = ${database.type === 'postgresql' ? '$3' : '?'}`,
            [town_hall_level, bonus_eligible, player_name]
          );
          console.log(`Updated ${player_name} TH level from ${currentPlayer.town_hall_level} to ${town_hall_level}`);
        }
        
        return currentPlayer.player_id;
      } else {
        // Create new player
        const result = await database.query(
          `INSERT INTO players (player_name, town_hall_level, bonus_eligible) VALUES (${database.type === 'postgresql' ? '$1, $2, $3' : '?, ?, ?'}) ${database.type === 'postgresql' ? 'RETURNING player_id' : ''}`,
          [player_name, town_hall_level, bonus_eligible]
        );
        
        const playerId = database.type === 'postgresql' ? result.rows[0].player_id : result.insertId;
        console.log(`Created new player: ${player_name}`);
        return playerId;
      }
    } catch (error) {
      console.error(`Error creating/updating player ${player_name}:`, error);
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
    const { player_name, day_number, stars_earned, destruction_percentage, enemy_town_hall_level, season_year, season_month } = attackData;
    
    try {
      // Get player ID
      const playerResult = await database.query(
        `SELECT player_id FROM players WHERE player_name = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [player_name]
      );
      
      if (!playerResult.rows || playerResult.rows.length === 0) {
        throw new Error(`Player ${player_name} not found`);
      }
      
      const player_id = playerResult.rows[0].player_id;
      
      // Get season ID
      const season_id = await this.createSeason(season_year, season_month);
      
      // Get war day ID
      const war_day_id = await this.createWarDay(season_id, day_number);
      
      // Check if attack already exists
      const existingAttack = await database.query(
        `SELECT attack_id FROM player_attacks WHERE player_id = ${database.type === 'postgresql' ? '$1' : '?'} AND war_day_id = ${database.type === 'postgresql' ? '$2' : '?'}`,
        [player_id, war_day_id]
      );
      
      if (existingAttack.rows && existingAttack.rows.length > 0) {
        // Update existing attack
        await database.query(
          `UPDATE player_attacks SET stars_earned = ${database.type === 'postgresql' ? '$1' : '?'}, destruction_percentage = ${database.type === 'postgresql' ? '$2' : '?'}, enemy_town_hall_level = ${database.type === 'postgresql' ? '$3' : '?'} WHERE player_id = ${database.type === 'postgresql' ? '$4' : '?'} AND war_day_id = ${database.type === 'postgresql' ? '$5' : '?'}`,
          [stars_earned, destruction_percentage, enemy_town_hall_level, player_id, war_day_id]
        );
      } else {
        // Create new attack
        await database.query(
          `INSERT INTO player_attacks (player_id, war_day_id, stars_earned, destruction_percentage, enemy_town_hall_level) VALUES (${database.type === 'postgresql' ? '$1, $2, $3, $4, $5' : '?, ?, ?, ?, ?'})`,
          [player_id, war_day_id, stars_earned, destruction_percentage, enemy_town_hall_level]
        );
      }
    } catch (error) {
      console.error(`Error adding attack for ${player_name}:`, error);
      throw error;
    }
  }
  
  async processCWLData(parsedData) {
    const { players, attacks } = parsedData;
    
    try {
      // Process players first
      for (const playerData of players) {
        await this.createOrUpdatePlayer(playerData);
      }
      
      // Process attacks
      for (const attackData of attacks) {
        await this.addPlayerAttack(attackData);
      }
      
      console.log(`Processed ${players.length} players and ${attacks.length} attacks`);
      return { playersProcessed: players.length, attacksProcessed: attacks.length };
    } catch (error) {
      console.error('Error processing CWL data:', error);
      throw error;
    }
  }
}

module.exports = CWLDataService;