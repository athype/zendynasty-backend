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
      const client = await cocClientManager.getClientAsync();
      const clan = await client.getClan(clanTag);
      return clan;
    } catch (error) {
      console.error('Error fetching clan info:', error);
      throw error;
    }
  }

  async getCapitalRaidInfo(clanTag) {
  try {
    const client = await cocClientManager.getClientAsync();
    const capitalRaid = await client.getClanCapitalRanks(clanTag);
    return capitalRaid;
  } catch (error) {
    console.error('Error fetching capital raid info:', error);
    throw error;
  }
}
}

module.exports = new CocService();