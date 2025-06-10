require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
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

// Session configuration - handle different environments
let sessionStore;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && process.env.DATABASE_URL) {
  // Use PostgreSQL for sessions in production
  const pgSession = require('connect-pg-simple')(session);
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  sessionStore = new pgSession({
    pool: pool,
    tableName: 'session'
  });
} else {
  // Use SQLite for sessions in development
  const SQLiteStore = require('connect-sqlite3')(session);
  sessionStore = new SQLiteStore({
    db: 'sessions.db',
    dir: './database'
  });
}

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: isProduction ? 'none' : 'lax'
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