const playerLinksService = require('../services/playerLinksService');
const externalLinksService = require('../services/externalLinksService');

const linkPlayer = async (req, res, next) => {
  try {
    const { playerTag } = req.body;
    const discordId = req.user.discord_id;
    
    if (!playerTag) {
      return res.status(400).json({
        error: 'Player tag is required'
      });
    }
    
    const result = await playerLinksService.linkPlayerToUser(discordId, playerTag);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const unlinkPlayer = async (req, res, next) => {
  try {
    const { playerTag } = req.params;
    const discordId = req.user.discord_id;
    
    if (!playerTag) {
      return res.status(400).json({
        error: 'Player tag is required'
      });
    }
    
    const result = await playerLinksService.unlinkPlayerFromUser(discordId, playerTag);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getMyLinkedPlayers = async (req, res, next) => {
  try {
    const discordId = req.user.discord_id;
    
    // First, try to get existing linked players from database
    let players = await playerLinksService.getUserLinkedPlayers(discordId);
    
    let autoImportResult = null;
    
    // If no players found, attempt to auto-import from external API
    if (players.length === 0) {
      try {
        console.log(`No linked players found for Discord ID ${discordId}, attempting auto-import...`);
        
        autoImportResult = await externalLinksService.importPlayerLinksForUser(discordId);
        
        // If successful, fetch the newly imported players
        if (autoImportResult.imported > 0) {
          players = await playerLinksService.getUserLinkedPlayers(discordId);
          console.log(`Auto-imported ${autoImportResult.imported} players for Discord ID ${discordId}`);
        }
      } catch (autoImportError) {
        console.error(`Auto-import failed for Discord ID ${discordId}:`, autoImportError);
        // Don't fail the request if auto-import fails, just log it
        autoImportResult = {
          imported: 0,
          players: [],
          errors: [autoImportError.message]
        };
      }
    }
    
    const response = {
      linkedPlayers: players
    };
    
    // Include auto-import information if it was attempted
    if (autoImportResult !== null) {
      response.autoImport = {
        attempted: true,
        imported: autoImportResult.imported,
        errors: autoImportResult.errors || []
      };
    }
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

const getPlayerLinkedUser = async (req, res, next) => {
  try {
    const { playerTag } = req.params;
    
    if (!playerTag) {
      return res.status(400).json({
        error: 'Player tag is required'
      });
    }
    
    const linkedUser = await playerLinksService.getPlayerLinkedUser(playerTag);
    
    if (!linkedUser) {
      return res.status(404).json({
        error: 'Player is not linked to any Discord user'
      });
    }
    
    res.json({
      linkedUser
    });
  } catch (error) {
    next(error);
  }
};

const getAllPlayerLinks = async (req, res, next) => {
  try {
    const links = await playerLinksService.getAllPlayerLinks();
    
    res.json({
      playerLinks: links
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  linkPlayer,
  unlinkPlayer,
  getMyLinkedPlayers,
  getPlayerLinkedUser,
  getAllPlayerLinks
};