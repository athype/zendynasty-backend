const database = require('../dataUtils/dbInit');
const jwt = require('jsonwebtoken');

class AuthService {
  
  async createOrUpdateUser(discordUser) {
    const { id, username, avatar, email } = discordUser;
    
    // Check if user is admin based on Discord ID
    const adminIds = process.env.ADMIN_DISCORD_IDS ? process.env.ADMIN_DISCORD_IDS.split(',') : [];
    const role = adminIds.includes(id) ? 'admin' : 'user';
    
    try {
      // Check if user exists
      const existingUser = await database.query(
        `SELECT user_id, role FROM users WHERE discord_id = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [id]
      );
      
      if (existingUser.rows && existingUser.rows.length > 0) {
        // Update existing user
        await database.query(
          `UPDATE users SET username = ${database.type === 'postgresql' ? '$1' : '?'}, avatar = ${database.type === 'postgresql' ? '$2' : '?'}, email = ${database.type === 'postgresql' ? '$3' : '?'}, role = ${database.type === 'postgresql' ? '$4' : '?'}, last_login = ${database.type === 'postgresql' ? 'CURRENT_TIMESTAMP' : 'CURRENT_TIMESTAMP'} WHERE discord_id = ${database.type === 'postgresql' ? '$5' : '?'}`,
          [username, avatar, email, role, id]
        );
        
        return {
          user_id: existingUser.rows[0].user_id,
          discord_id: id,
          username,
          avatar,
          email,
          role
        };
      } else {
        // Create new user
        const result = await database.query(
          `INSERT INTO users (discord_id, username, avatar, email, role) VALUES (${database.type === 'postgresql' ? '$1, $2, $3, $4, $5' : '?, ?, ?, ?, ?'}) ${database.type === 'postgresql' ? 'RETURNING user_id' : ''}`,
          [id, username, avatar, email, role]
        );
        
        const userId = database.type === 'postgresql' ? result.rows[0].user_id : result.insertId;
        
        return {
          user_id: userId,
          discord_id: id,
          username,
          avatar,
          email,
          role
        };
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }
  
  generateJWT(user) {
    const payload = {
      user_id: user.user_id,
      discord_id: user.discord_id,
      username: user.username,
      role: user.role
    };
    
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  }
  
  verifyJWT(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
  
  async getUserById(userId) {
    try {
      const result = await database.query(
        `SELECT user_id, discord_id, username, avatar, email, role FROM users WHERE user_id = ${database.type === 'postgresql' ? '$1' : '?'}`,
        [userId]
      );
      
      return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();