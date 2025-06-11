const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const authService = require('../services/authService');

// Debug: Check if environment variables are loaded
console.log('Environment check:');
console.log('DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? 'Found' : 'Missing');
console.log('DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? 'Found' : 'Missing');
console.log('DISCORD_CALLBACK_URL:', process.env.DISCORD_CALLBACK_URL);

// Ensure we have the required environment variables
if (!process.env.DISCORD_CLIENT_ID) {
  throw new Error('DISCORD_CLIENT_ID environment variable is required');
}
if (!process.env.DISCORD_CLIENT_SECRET) {
  throw new Error('DISCORD_CLIENT_SECRET environment variable is required');
}

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const user = await authService.createOrUpdateUser(profile);
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (userId, done) => {
  try {
    const user = await authService.getUserById(userId);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;