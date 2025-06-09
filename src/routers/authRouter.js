const express = require('express');
const passport = require('../config/passport');
const { authenticate } = require('../middlewares/auth');
const {
  discordCallback,
  getProfile,
  logout
} = require('../controllers/authController');

const router = express.Router();

// Discord OAuth routes
router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/auth/failure' }), discordCallback);

// Profile route
router.get('/profile', authenticate, getProfile);

// Logout route
router.post('/logout', logout);

// Auth failure route
router.get('/failure', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

module.exports = router;