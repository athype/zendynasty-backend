const path = require("path");

function createDatabase() {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;
  
  if (isProduction) {
    // PostgreSQL for production
    const { Pool } = require('pg');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    return {
      type: 'postgresql',
      client: pool,
      query: (sql, params = []) => pool.query(sql, params),
      close: () => pool.end()
    };
  } else {
    // SQLite for development
    const sqlite3 = require("sqlite3").verbose();
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, "../../database/survey.db");
    
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