const axios = require('axios');
const cwlDataService = require('./cwlDataService');
const playerLinksService = require('./playerLinksService');
const cocApiService = require('./cocApiService');

class ExternalLinksService {
  
  constructor() {
    const baseUrl = process.env.CLASH_KING_API_URL || 'https://api.clashk.ing';
    this.apiUrl = `${baseUrl}/discord_links`;
  }
  
  async fetchPlayerLinksFromExternal(discordIds) {
    try {
      console.log(`Fetching player links for ${discordIds.length} Discord IDs from external API...`);
      
      const response = await axios.post(this.apiUrl, discordIds, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });
      
      if (!response.data) {
        throw new Error('No data received from external API');
      }
      
      console.log(`External API returned data for ${Object.keys(response.data).length} entries`);
      // ADD DEBUG LOGGING HERE
      console.log('Raw external API response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
      
    } catch (error) {
      if (error.response) {
        console.error(`External API error: ${error.response.status} - ${error.response.statusText}`);
        throw new Error(`External API returned ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        console.error('No response received from external API');
        throw new Error('No response received from external API');
      } else {
        console.error('Error setting up request to external API:', error.message);
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }
  
  async importPlayerLinksForUser(discordId) {
  try {
    console.log(`Importing player links for Discord ID: ${discordId}`);
    
    // Fetch links from external API
    const externalLinks = await this.fetchPlayerLinksFromExternal([discordId]);
    
    console.log(`Looking for Discord ID: ${discordId} (type: ${typeof discordId})`);
    
    // Convert discordId to both string and number for comparison
    const discordIdString = discordId.toString();
    const discordIdNumber = parseInt(discordId);
    
    // Filter out player tags for this specific Discord ID
    const playerTags = Object.keys(externalLinks).filter(key => {
      const isPlayerTag = key.startsWith('#');
      const value = externalLinks[key];
      
      // Check if value matches either string or number version of discordId
      const matchesAsString = value === discordIdString;
      const matchesAsNumber = value === discordIdNumber;
      const matchesDiscordId = matchesAsString || matchesAsNumber;
      
      console.log(`Key: ${key}, IsPlayerTag: ${isPlayerTag}, Value: ${value} (type: ${typeof value}), MatchesString: ${matchesAsString}, MatchesNumber: ${matchesAsNumber}, Overall: ${matchesDiscordId}`);
      
      return isPlayerTag && matchesDiscordId && value !== null;
    });
    
    console.log(`Found ${playerTags.length} matching player tags:`, playerTags);
    
    if (playerTags.length === 0) {
      // Provide more helpful error message
      const availableDiscordIds = [...new Set(Object.values(externalLinks).filter(v => v !== null))];
      console.log(`No player tags found for Discord ID ${discordId}`);
      console.log(`Available Discord IDs in response:`, availableDiscordIds);
      return { 
        imported: 0, 
        players: [], 
        errors: [`No players found for Discord ID ${discordId}. Available Discord IDs: ${availableDiscordIds.join(', ')}`] 
      };
    }
    
    console.log(`Found ${playerTags.length} player tags for Discord ID ${discordId}: ${playerTags.join(', ')}`);
    
    const importedPlayers = [];
    const errors = [];
    
    for (const playerTag of playerTags) {
      try {
        // Get player info from CoC API
        const playerInfo = await cocApiService.getPlayerInfo(playerTag);
        
        if (!playerInfo) {
          console.warn(`Could not fetch player info for ${playerTag}`);
          errors.push(`Could not fetch player info for ${playerTag}`);
          continue;
        }
        
        // Create or update player in database
        const playerId = await cwlDataService.createOrUpdatePlayer({
          player_tag: playerTag,
          player_name: playerInfo.name,
          town_hall_level: playerInfo.townHallLevel
        });
        
        // Link player to user - handle case where link already exists
        try {
          await playerLinksService.linkPlayerToUser(discordId, playerTag);
          
          importedPlayers.push({
            playerTag,
            playerName: playerInfo.name,
            townHallLevel: playerInfo.townHallLevel
          });
          
          console.log(`Successfully imported ${playerInfo.name} (${playerTag})`);
        } catch (linkError) {
          // If player is already linked to this user, consider it a success
          if (linkError.message.includes('already linked to this user')) {
            importedPlayers.push({
              playerTag,
              playerName: playerInfo.name,
              townHallLevel: playerInfo.townHallLevel
            });
            console.log(`Player ${playerInfo.name} (${playerTag}) was already linked`);
          } else {
            throw linkError;
          }
        }
        
        // Add small delay to avoid overwhelming the CoC API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error importing player ${playerTag}:`, error.message);
        errors.push(`${playerTag}: ${error.message}`);
      }
    }
    
    return {
      imported: importedPlayers.length,
      players: importedPlayers,
      errors: errors
    };
    
  } catch (error) {
    console.error(`Error importing player links for ${discordId}:`, error);
    throw error;
  }
}
  
  // ...rest of the methods remain the same...
  
  async importPlayerLinksForMultipleUsers(discordIds) {
    try {
      console.log(`Importing player links for ${discordIds.length} Discord IDs...`);
      
      // Fetch all links from external API
      const externalLinks = await this.fetchPlayerLinksFromExternal(discordIds);
      
      const results = {
        totalImported: 0,
        userResults: [],
        globalErrors: []
      };
      
      // Group player tags by Discord ID
      const linksByDiscordId = {};
      
      Object.entries(externalLinks).forEach(([key, discordId]) => {
        if (key.startsWith('#') && discordId && discordIds.includes(discordId)) {
          if (!linksByDiscordId[discordId]) {
            linksByDiscordId[discordId] = [];
          }
          linksByDiscordId[discordId].push(key);
        }
      });
      
      // Process each Discord ID
      for (const discordId of discordIds) {
        try {
          const playerTags = linksByDiscordId[discordId] || [];
          
          if (playerTags.length === 0) {
            results.userResults.push({
              discordId,
              imported: 0,
              players: [],
              errors: ['No player tags found for this Discord ID']
            });
            continue;
          }
          
          const userResult = await this.processUserPlayerTags(discordId, playerTags);
          results.userResults.push(userResult);
          results.totalImported += userResult.imported;
          
        } catch (error) {
          console.error(`Error processing Discord ID ${discordId}:`, error);
          results.userResults.push({
            discordId,
            imported: 0,
            players: [],
            errors: [error.message]
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error importing player links for multiple users:', error);
      throw error;
    }
  }
  
  async processUserPlayerTags(discordId, playerTags) {
    const importedPlayers = [];
    const errors = [];
    
    for (const playerTag of playerTags) {
      try {
        // Get player info from CoC API
        const playerInfo = await cocApiService.getPlayerInfo(playerTag);
        
        if (!playerInfo) {
          errors.push(`Could not fetch player info for ${playerTag}`);
          continue;
        }
        
        // Create or update player in database
        await cwlDataService.createOrUpdatePlayer({
          player_tag: playerTag,
          player_name: playerInfo.name,
          town_hall_level: playerInfo.townHallLevel
        });
        
        // Link player to user
        await playerLinksService.linkPlayerToUser(discordId, playerTag);
        
        importedPlayers.push({
          playerTag,
          playerName: playerInfo.name,
          townHallLevel: playerInfo.townHallLevel
        });
        
        // Add small delay to avoid overwhelming the CoC API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error importing player ${playerTag}:`, error.message);
        errors.push(`${playerTag}: ${error.message}`);
      }
    }
    
    return {
      discordId,
      imported: importedPlayers.length,
      players: importedPlayers,
      errors
    };
  }
  
  async validateExternalApiConnection() {
    try {
      // Test with a dummy Discord ID to check if API is responsive
      const testResponse = await axios.post(this.apiUrl, ["123456789"], {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      return {
        status: 'connected',
        responseTime: Date.now(),
        message: 'External API is responsive'
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        message: 'External API is not responsive'
      };
    }
  }
}

module.exports = new ExternalLinksService();