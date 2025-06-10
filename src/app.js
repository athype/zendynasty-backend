require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('./config/passport');

const db = require('./dataUtils/dbInit');

const middlewares = require('./middlewares');
const authRouter = require('./routers/authRouter');
const cwlRouter = require('./routers/cwlRouter');
const uploadRouter = require('./routers/uploadRouter');

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './database'
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req, res) => {
  res.json({
    message: 'I am alive',
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/cwl', cwlRouter);
app.use('/api/v1/upload', uploadRouter);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;