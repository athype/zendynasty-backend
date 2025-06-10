const createDatabase = require('./dbFactory');

let database = null;
let isPostgreSQL = null;

// Lazy initialization function
function getDatabase() {
  if (!database) {
    database = createDatabase();
    isPostgreSQL = database.type === 'postgresql';
  }
  return database;
}

// Schema definitions with conditional SQL
const getSchemaSQL = () => {
  const db = getDatabase();
  const autoIncrement = db.type === 'postgresql' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const booleanType = db.type === 'postgresql' ? 'BOOLEAN' : 'BOOLEAN';
  const booleanDefault = db.type === 'postgresql' ? 'FALSE' : '0';
  const decimalType = db.type === 'postgresql' ? 'DECIMAL(5,2)' : 'REAL';
  const timestampType = db.type === 'postgresql' ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'DATETIME DEFAULT CURRENT_TIMESTAMP';

  return {
    // Add users table
    users: `
      CREATE TABLE IF NOT EXISTS users (
        user_id ${autoIncrement},
        discord_id VARCHAR(50) NOT NULL UNIQUE,
        username VARCHAR(100) NOT NULL,
        avatar VARCHAR(255),
        email VARCHAR(255),
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at ${timestampType},
        last_login ${timestampType}
      );
    `,
    
    players: `
      CREATE TABLE IF NOT EXISTS players (
        player_id ${autoIncrement},
        player_name VARCHAR(50) NOT NULL UNIQUE,
        town_hall_level INTEGER NOT NULL CHECK (town_hall_level BETWEEN 1 AND 17),
        bonus_eligible ${booleanType} NOT NULL DEFAULT ${booleanDefault}
      );
    `,
    
    cwl_seasons: `
      CREATE TABLE IF NOT EXISTS cwl_seasons (
        season_id ${autoIncrement},
        season_year INTEGER NOT NULL,
        season_month INTEGER NOT NULL CHECK (season_month BETWEEN 1 AND 12),
        UNIQUE(season_year, season_month)
      );
    `,
    
    war_days: `
      CREATE TABLE IF NOT EXISTS war_days (
        war_day_id ${autoIncrement},
        season_id INTEGER NOT NULL,
        day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 7),
        UNIQUE(season_id, day_number),
        FOREIGN KEY (season_id) REFERENCES cwl_seasons(season_id)
      );
    `,
    
    player_attacks: `
      CREATE TABLE IF NOT EXISTS player_attacks (
        attack_id ${autoIncrement},
        player_id INTEGER NOT NULL,
        war_day_id INTEGER NOT NULL,
        stars_earned INTEGER NOT NULL CHECK (stars_earned BETWEEN 0 AND 3),
        destruction_percentage ${decimalType} NOT NULL CHECK (destruction_percentage BETWEEN 0 AND 100),
        enemy_town_hall_level INTEGER NOT NULL CHECK (enemy_town_hall_level BETWEEN 1 AND 17),
        UNIQUE(player_id, war_day_id),
        FOREIGN KEY (player_id) REFERENCES players(player_id),
        FOREIGN KEY (war_day_id) REFERENCES war_days(war_day_id)
      );
    `
  };
};

async function initializeDatabase() {
  try {
    const db = getDatabase();
    console.log(`Initializing ${db.type} database...`);
    
    const schemas = getSchemaSQL();
    
    // Create tables
    await db.query(schemas.users);
    await db.query(schemas.players);
    await db.query(schemas.cwl_seasons);
    await db.query(schemas.war_days);
    await db.query(schemas.player_attacks);
    
    // Create indexes
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_player_attacks_player_id ON player_attacks(player_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_player_attacks_war_day_id ON player_attacks(war_day_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_war_days_season_id ON war_days(season_id);`);
    
    // Create view with conditional syntax
    const viewSQL = db.type === 'postgresql' 
      ? `CREATE OR REPLACE VIEW cwl_performance_summary AS`
      : `CREATE VIEW IF NOT EXISTS cwl_performance_summary AS`;
      
    await db.query(`
      ${viewSQL}
      SELECT 
        p.player_name,
        p.town_hall_level,
        p.bonus_eligible,
        cs.season_year,
        cs.season_month,
        wd.day_number,
        pa.stars_earned,
        pa.destruction_percentage,
        pa.enemy_town_hall_level
      FROM players p
      JOIN player_attacks pa ON p.player_id = pa.player_id
      JOIN war_days wd ON pa.war_day_id = wd.war_day_id
      JOIN cwl_seasons cs ON wd.season_id = cs.season_id
      ORDER BY cs.season_year DESC, cs.season_month DESC, wd.day_number, p.player_name;
    `);
    
    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

// Create a proxy object that delegates to the actual database
const databaseProxy = {
  get type() {
    return getDatabase().type;
  },
  get client() {
    return getDatabase().client;
  },
  query: (...args) => getDatabase().query(...args),
  close: () => getDatabase().close(),
  initialize: initializeDatabase
};

// Initialize on first access instead of immediately
setTimeout(() => {
  initializeDatabase().catch(console.error);
}, 100);

module.exports = databaseProxy;