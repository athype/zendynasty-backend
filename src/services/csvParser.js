const csv = require('csv-parser');
const fs = require('fs');

class CWLDataParser {
  constructor() {
    this.players = [];
    this.attacks = [];
  }

  async parseCWLCSV(filePath, season_year, season_month) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          try {
            const parsedData = this.processCSVData(results, season_year, season_month);
            resolve(parsedData);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  processCSVData(csvData, season_year, season_month) {
    const players = [];
    const attacks = [];
    
    // Skip the first row (header with day labels)
    const dataRows = csvData.slice(1);
    
    dataRows.forEach((row) => {
      const playerName = row[''] || row['Players']; // Handle different column names
      const townHallLevel = parseInt(row['TH']) || 17;
      const bonusEligible = (row['Bonus'] === 'Y') ? true : false;
      
      if (!playerName) return; // Skip empty rows
      
      // Add player data
      players.push({
        player_name: playerName,
        town_hall_level: townHallLevel,
        bonus_eligible: bonusEligible
      });
      
      // Process attacks for each day (7 days)
      for (let day = 1; day <= 7; day++) {
        const starsKey = `Day ${day}`;
        const destKey = `Day ${day}.1`; // % Dest column
        const thKey = `Day ${day}.2`; // Enemy TH column
        
        const stars = parseInt(row[starsKey]);
        const destruction = parseFloat(row[destKey]);
        const enemyTH = parseInt(row[thKey]);
        
        // Only add attack if we have valid data
        if (!isNaN(stars) && !isNaN(destruction) && !isNaN(enemyTH)) {
          attacks.push({
            player_name: playerName,
            day_number: day,
            stars_earned: stars,
            destruction_percentage: destruction,
            enemy_town_hall_level: enemyTH,
            season_year,
            season_month
          });
        }
      }
    });
    
    return { players, attacks };
  }

  // Alternative parser for the specific CSV format you provided
  parseSpecificFormat(csvData, season_year, season_month) {
    const players = [];
    const attacks = [];
    
    // Parse the header to understand the structure
    const lines = csvData.trim().split('\n');
    const dataLines = lines.slice(2); // Skip first two header lines
    
    dataLines.forEach((line) => {
      const columns = this.parseCSVLine(line);
      
      if (columns.length < 3) return; // Skip invalid lines
      
      const playerName = columns[0];
      const townHallLevel = parseInt(columns[1]) || 17;
      const bonusEligible = columns[2] === 'Y';
      
      if (!playerName) return;
      
      // Add player
      players.push({
        player_name: playerName,
        town_hall_level: townHallLevel,
        bonus_eligible: bonusEligible
      });
      
      // Parse attacks - each day has 3 columns (Stars, % Dest, TH)
      let columnIndex = 3;
      for (let day = 1; day <= 7; day++) {
        const stars = parseInt(columns[columnIndex]);
        const destruction = parseFloat(columns[columnIndex + 1]);
        const enemyTH = parseInt(columns[columnIndex + 2]);
        
        if (!isNaN(stars) && !isNaN(destruction) && !isNaN(enemyTH)) {
          attacks.push({
            player_name: playerName,
            day_number: day,
            stars_earned: stars,
            destruction_percentage: destruction,
            enemy_town_hall_level: enemyTH,
            season_year,
            season_month
          });
        }
        
        columnIndex += 3; // Move to next day's data
      }
    });
    
    return { players, attacks };
  }
  
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}

module.exports = CWLDataParser;