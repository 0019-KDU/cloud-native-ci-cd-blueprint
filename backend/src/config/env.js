/**
 * Environment Configuration
 *
 * Purpose: Safely reads and validates environment variables
 * Used by: All backend services that need config (DB, OpenAI, server port)
 *
 * This module centralizes all environment variable access and provides
 * sensible defaults for development. In production, all values should
 * come from actual environment variables.
 */

// Load environment variables from .env file
// This only works if you install the 'dotenv' package
// Run: npm install dotenv
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const config = {
  // Server configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  // Format: postgres://username:password@host:port/database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'incident_assistant',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    // Connection pool settings
    max: 20, // Maximum number of connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10), // Timeout in milliseconds
  },

  // OpenAI API configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini', // Cheaper, faster model for this use case
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'), // 0-1, higher = more creative
  },

  // CORS configuration (which frontends can access this API)
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Vite's default dev port
  },
};

// Validation: Make sure critical env vars are set
function validateConfig() {
  const errors = [];

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required but not set');
  }

  if (!config.database.password) {
    console.warn('⚠️  Warning: DB_PASSWORD not set, using default "postgres"');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1); // Exit if critical config is missing
  }
}

// Run validation when this module is loaded
validateConfig();

module.exports = config;
