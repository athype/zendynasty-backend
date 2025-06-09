const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const authService = require('../services/authService');

passport.use(new DiscordStrategy({
  clientID: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL: process.env.DISCORD_CALLBACK_URL,
  scope: ['identify', 'email']
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