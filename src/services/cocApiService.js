const cocClientManager = require('../config/cocApi');

class CocService {
  
  async getPlayerInfo(playerTag) {
    try {
      const client = await cocClientManager.getClientAsync();
      const player = await client.getPlayer(playerTag);
      return player;
    } catch (error) {
      console.error('Error fetching player info:', error);
      throw error;
    }
  }

  async getClanInfo(clanTag) {
    try {
      // Alternative: Check if ready first
      if (!cocClientManager.isReady()) {
        throw new Error('CoC Client not ready');
      }
      
      const client = cocClientManager.getClient();
      const clan = await client.getClan(clanTag);
      return clan;
    } catch (error) {
      console.error('Error fetching clan info:', error);
      throw error;
    }
  }
}

module.exports = new CocService();