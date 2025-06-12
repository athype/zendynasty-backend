require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const cocClientManager = require('./config/cocApi');
const { specs, swaggerUi } = require('./config/swagger');

const db = require('./dataUtils/dbInit');

const middlewares = require('./middlewares');
const authRouter = require('./routers/authRouter');
const cwlRouter = require('./routers/cwlRouter');
const uploadRouter = require('./routers/uploadRouter');
const clashRouter = require('./routers/clashRouter');

const app = express();

// Initialize CoC Client on startup
cocClientManager.initialize().catch(error => {
  console.error('Failed to initialize CoC Client:', error);
});

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
    tableName: 'session',
    createTableIfMissing: true
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

app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Zen Dynasty API Documentation'
}));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: db.type,
    cocClient: cocClientManager.isReady() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/cwl', cwlRouter);
app.use('/api/v1/upload', uploadRouter);
app.use('/api/v1/clash', clashRouter);

app.use(middlewares.notFound);
app.use(middlewares.errorHandler);

module.exports = app;