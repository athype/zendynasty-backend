const path = require("path");

function createDatabase() {
  // Railway automatically sets NODE_ENV to production and provides DATABASE_URL
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.DATABASE_URL || 
                      process.env.RAILWAY_ENVIRONMENT;
  
  console.log('Database environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasDatabase_URL: !!process.env.DATABASE_URL,
    DATABASE_URL_preview: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'not set',
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
    isProduction
  });
  
  if (isProduction && process.env.DATABASE_URL) {
    console.log('Using PostgreSQL for production');
    // PostgreSQL for production
    const { Pool } = require('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Test the connection
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });
    
    pool.on('error', (err) => {
      console.error('PostgreSQL connection error:', err);
    });
    
    return {
      type: 'postgresql',
      client: pool,
      query: (sql, params = []) => pool.query(sql, params),
      close: () => pool.end()
    };
  } else {
    console.log('Using SQLite for development');
    // SQLite for development
    const sqlite3 = require("sqlite3").verbose();
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, "../../database/mainClash.db");
    
    console.log('SQLite database path:', dbPath);
    
    const db = new sqlite3.Database(dbPath);
    db.run("PRAGMA foreign_keys = ON;");
    
    // Promisify SQLite methods
    const query = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve({ rows });
          });
        } else {
          db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve({ rowCount: this.changes, insertId: this.lastID });
          });
        }
      });
    };
    
    return {
      type: 'sqlite',
      client: db,
      query,
      close: () => db.close()
    };
  }
}

module.exports = createDatabase;