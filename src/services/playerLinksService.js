const database = require('../dataUtils/dbInit');

class PlayerLinksService {
  
  async linkPlayerToUser(discordId, playerTag) {
    try {
      // Get user ID
      const userResult = await database.query(
        `SELECT user_id FROM users WHERE discord_id = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [discordId]
      );
      
      if (!userResult.rows || userResult.rows.length === 0) {
        throw new Error(`User with Discord ID ${discordId} not found`);
      }
      
      const user_id = userResult.rows[0].user_id;
      
      // Get player ID
      const playerResult = await database.query(
        `SELECT player_id FROM players WHERE player_tag = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [playerTag]
      );
      
      if (!playerResult.rows || playerResult.rows.length === 0) {
        throw new Error(`Player with tag ${playerTag} not found`);
      }
      
      const player_id = playerResult.rows[0].player_id;
      
      // Check if player is already linked to someone else
      const existingLink = await database.query(
        `SELECT u.discord_id, u.username FROM player_links pl 
         JOIN users u ON pl.user_id = u.user_id 
         WHERE pl.player_id = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [player_id]
      );
      
      if (existingLink.rows && existingLink.rows.length > 0) {
        const linkedUser = existingLink.rows[0];
        if (linkedUser.discord_id !== discordId) {
          throw new Error(`Player ${playerTag} is already linked to ${linkedUser.username} (${linkedUser.discord_id})`);
        }
        // Already linked to the same user
        return { message: 'Player is already linked to this user' };
      }
      
      // Create the link
      const result = await database.query(
        `INSERT INTO player_links (user_id, player_id) VALUES (${database.type === 'postgresql' ? '$1, $2' : '?, ?'}) ${database.type === 'postgresql' ? 'RETURNING link_id' : ''}`,
        [user_id, player_id]
      );
      
      const linkId = database.type === 'postgresql' ? result.rows[0].link_id : result.insertId;
      
      console.log(`Linked player ${playerTag} to Discord user ${discordId}`);
      return { linkId, message: 'Player linked successfully' };
      
    } catch (error) {
      console.error(`Error linking player ${playerTag} to user ${discordId}:`, error);
      throw error;
    }
  }
  
  async unlinkPlayerFromUser(discordId, playerTag) {
    try {
      const result = await database.query(
        `DELETE FROM player_links 
         WHERE user_id = (SELECT user_id FROM users WHERE discord_id = ${database.type === 'postgresql' ? '$1' : '?'})
         AND player_id = (SELECT player_id FROM players WHERE player_tag = ${database.type === 'postgresql' ? '$2' : '?'})`,
        [discordId, playerTag]
      );
      
      const affectedRows = database.type === 'postgresql' ? result.rowCount : result.affectedRows;
      
      if (affectedRows === 0) {
        throw new Error(`No link found between Discord user ${discordId} and player ${playerTag}`);
      }
      
      console.log(`Unlinked player ${playerTag} from Discord user ${discordId}`);
      return { message: 'Player unlinked successfully' };
      
    } catch (error) {
      console.error(`Error unlinking player ${playerTag} from user ${discordId}:`, error);
      throw error;
    }
  }
  
  async getUserLinkedPlayers(discordId) {
    try {
      const result = await database.query(
        `SELECT 
           p.player_tag,
           p.player_name,
           p.town_hall_level,
           pl.linked_at
         FROM player_links pl
         JOIN players p ON pl.player_id = p.player_id
         JOIN users u ON pl.user_id = u.user_id
         WHERE u.discord_id = ${database.type === 'postgresql' ? '$1' : '?'}
         ORDER BY pl.linked_at ASC`,
        [discordId]
      );
      
      return result.rows || [];
    } catch (error) {
      console.error(`Error getting linked players for user ${discordId}:`, error);
      throw error;
    }
  }
  
  async getPlayerLinkedUser(playerTag) {
    try {
      const result = await database.query(
        `SELECT 
           u.discord_id,
           u.username,
           pl.linked_at
         FROM player_links pl
         JOIN users u ON pl.user_id = u.user_id
         JOIN players p ON pl.player_id = p.player_id
         WHERE p.player_tag = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [playerTag]
      );
      
      return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error getting linked user for player ${playerTag}:`, error);
      throw error;
    }
  }
  
  async getAllPlayerLinks() {
    try {
      const result = await database.query(`
        SELECT 
          u.discord_id,
          u.username,
          p.player_tag,
          p.player_name,
          p.town_hall_level,
          pl.linked_at
        FROM player_links pl
        JOIN users u ON pl.user_id = u.user_id
        JOIN players p ON pl.player_id = p.player_id
        ORDER BY u.username, pl.linked_at ASC
      `);
      
      return result.rows || [];
    } catch (error) {
      console.error('Error getting all player links:', error);
      throw error;
    }
  }
}

module.exports = new PlayerLinksService();