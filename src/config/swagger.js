const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zen Dynasty API',
      version: '1.0.0',
      description: 'API for managing all things related to Zen Dynasty, including user management, player stats, and CWL performance.',
      contact: {
        name: 'Zen Dynasty',
        email: 'admin@zenclash.ing'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'zendynasty-backend-production.up.railway.app'
          : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            discord_id: { type: 'string' },
            username: { type: 'string' },
            avatar: { type: 'string' },
            role: { 
              type: 'string',
              enum: ['user', 'admin']
            },
            created_at: { type: 'string', format: 'date-time' },
            last_login: { type: 'string', format: 'date-time' }
          }
        },
        Player: {
          type: 'object',
          properties: {
            player_id: { type: 'integer' },
            player_name: { type: 'string' },
            town_hall_level: { type: 'integer', minimum: 1, maximum: 17 },
            bonus_eligible: { type: 'boolean' }
          }
        },
        PlayerLink: {
          type: 'object',
          properties: {
            link_id: { type: 'integer' },
            user_id: { type: 'integer' },
            player_id: { type: 'integer' },
            is_main_account: { type: 'boolean' },
            linked_at: { type: 'string', format: 'date-time' },
            player_tag: { type: 'string', example: '#CLV98LRJ' },
            player_name: { type: 'string' },
            town_hall_level: { type: 'integer' },
            discord_id: { type: 'string' },
            username: { type: 'string' }
          }
        },
        PlayerAttack: {
          type: 'object',
          properties: {
            attack_id: { type: 'integer' },
            player_id: { type: 'integer' },
            war_day_id: { type: 'integer' },
            stars_earned: { type: 'integer', minimum: 0, maximum: 3 },
            destruction_percentage: { type: 'number', minimum: 0, maximum: 100 },
            enemy_town_hall_level: { type: 'integer', minimum: 1, maximum: 17 }
          }
        },
        Season: {
          type: 'object',
          properties: {
            season_id: { type: 'integer' },
            season_year: { type: 'integer' },
            season_month: { type: 'integer', minimum: 1, maximum: 12 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'string' }
          }
        }
      }
    }
  },
  apis: ['./src/routers/*.js', './src/controllers/*.js'],
};

const specs = swaggerJSDoc(options);

module.exports = { specs, swaggerUi };