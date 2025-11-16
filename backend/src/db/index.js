/**
 * Database Connection Pool
 *
 * Purpose: Creates and manages PostgreSQL connection pool using 'pg' library
 * Used by: All services that need to query the database (incidents.service.js)
 *
 * Flow:
 * 1. Reads DB config from env.js
 * 2. Creates a Pool (manages multiple connections efficiently)
 * 3. Exports the pool and a query helper function
 * 4. Provides graceful shutdown on app termination
 *
 * Why use a Pool instead of single Client?
 * - Handles multiple concurrent requests efficiently
 * - Automatically reconnects if connection drops
 * - Reuses connections instead of creating new ones for each query
 */

const { Pool } = require('pg');
const config = require('../config/env');
const logger = require('../config/logger');

// Create connection pool with configuration from env.js
const pool = new Pool(config.database);

// Event handlers for monitoring pool health
pool.on('connect', () => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database pool error', err);
  // Don't exit the process - pool will try to reconnect
});

/**
 * Test database connection on startup
 * This helps catch connection issues early before the app starts
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.success(`Database connected successfully at ${result.rows[0].now}`);
    client.release(); // Return connection to pool
    return true;
  } catch (error) {
    logger.error('Failed to connect to database', {
      message: error.message,
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
    });
    throw error;
  }
}

/**
 * Helper function to execute queries
 * This wraps pool.query with logging and error handling
 *
 * @param {string} text - SQL query string (use $1, $2 for parameters)
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object>} - Query result with rows array
 *
 * Example usage:
 *   const result = await query('SELECT * FROM incidents WHERE id = $1', [5]);
 *   console.log(result.rows);
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', {
      text: text.substring(0, 100), // First 100 chars
      duration: `${duration}ms`,
      rows: result.rowCount,
    });
    return result;
  } catch (error) {
    logger.error('Database query error', {
      query: text,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Gracefully close all database connections
 * Call this when shutting down the server
 */
async function closePool() {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool', error);
  }
}

// Export the pool and helper functions
module.exports = {
  query,          // Use this for most queries
  pool,           // Use this if you need transactions or advanced features
  testConnection, // Call this on app startup
  closePool,      // Call this on app shutdown
};
