const createDatabase = require('./dbFactory');

const database = createDatabase();
const isPostgreSQL = database.type === 'postgresql';

// Schema definitions with conditional SQL
const getSchemaSQL = () => {
  const autoIncrement = isPostgreSQL ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT';
  const booleanType = isPostgreSQL ? 'BOOLEAN' : 'BOOLEAN';
  const booleanDefault = isPostgreSQL ? 'FALSE' : '0';
  const decimalType = isPostgreSQL ? 'DECIMAL(5,2)' : 'REAL';

  return {
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
    console.log(`Initializing ${database.type} database...`);
    
    const schemas = getSchemaSQL();
    
    // Create tables
    await database.query(schemas.players);
    await database.query(schemas.cwl_seasons);
    await database.query(schemas.war_days);
    await database.query(schemas.player_attacks);
    
    // Create indexes
    await database.query(`CREATE INDEX IF NOT EXISTS idx_player_attacks_player_id ON player_attacks(player_id);`);
    await database.query(`CREATE INDEX IF NOT EXISTS idx_player_attacks_war_day_id ON player_attacks(war_day_id);`);
    await database.query(`CREATE INDEX IF NOT EXISTS idx_war_days_season_id ON war_days(season_id);`);
    
    // Create view with conditional syntax
    const viewSQL = isPostgreSQL 
      ? `CREATE OR REPLACE VIEW cwl_performance_summary AS`
      : `CREATE VIEW IF NOT EXISTS cwl_performance_summary AS`;
      
    await database.query(`
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

// Initialize on startup
initializeDatabase().catch(console.error);

module.exports = database;