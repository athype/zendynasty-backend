const externalLinksService = require('../services/externalLinksService');

const importMyPlayerLinks = async (req, res, next) => {
  try {
    const discordId = req.user.discord_id;
    
    const result = await externalLinksService.importPlayerLinksForUser(discordId);
    
    res.json({
      message: 'Player links import completed',
      discordId,
      ...result
    });
    
  } catch (error) {
    next(error);
  }
};

const importPlayerLinksForUsers = async (req, res, next) => {
  try {
    const { discordIds } = req.body;
    
    if (!discordIds || !Array.isArray(discordIds) || discordIds.length === 0) {
      return res.status(400).json({
        error: 'discordIds array is required'
      });
    }
    
    if (discordIds.length > 50) {
      return res.status(400).json({
        error: 'Maximum 50 Discord IDs allowed per request'
      });
    }
    
    // Validate Discord ID format
    const invalidIds = discordIds.filter(id => !/^\d{17,19}$/.test(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        error: `Invalid Discord IDs: ${invalidIds.join(', ')}`
      });
    }
    
    const result = await externalLinksService.importPlayerLinksForMultipleUsers(discordIds);
    
    res.json({
      message: 'Bulk player links import completed',
      ...result
    });
    
  } catch (error) {
    next(error);
  }
};

const checkExternalApiStatus = async (req, res, next) => {
  try {
    const status = await externalLinksService.validateExternalApiConnection();
    
    res.json({
      externalApi: status
    });
    
  } catch (error) {
    next(error);
  }
};

const previewPlayerLinksForUser = async (req, res, next) => {
  try {
    const { discordId } = req.params;
    
    if (!discordId || !/^\d{17,19}$/.test(discordId)) {
      return res.status(400).json({
        error: 'Valid Discord ID is required'
      });
    }
    
    // Just fetch the links without importing
    const externalLinks = await externalLinksService.fetchPlayerLinksFromExternal([discordId]);
    
    const playerTags = Object.keys(externalLinks).filter(key => {
      return key.startsWith('#') && externalLinks[key] === discordId;
    });
    
    res.json({
      discordId,
      playerTags,
      count: playerTags.length,
      preview: true
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  importMyPlayerLinks,
  importPlayerLinksForUsers,
  checkExternalApiStatus,
  previewPlayerLinksForUser
};