/**
 * Express Application Entry Point
 *
 * Purpose: Main server file that sets up and starts the Express application
 *
 * This file orchestrates everything:
 * 1. Loads configuration
 * 2. Creates Express app
 * 3. Sets up middleware (CORS, JSON parsing, logging)
 * 4. Connects routes
 * 5. Sets up error handling
 * 6. Connects to database
 * 7. Starts the HTTP server
 *
 * Flow when server starts:
 * - Load config ’ Test DB connection ’ Start Express ’ Listen on port
 *
 * Flow when request comes in:
 * - CORS middleware ’ JSON parser ’ Route handler ’ Error handler ’ Response
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const logger = require('./config/logger');
const db = require('./db');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const incidentsRoutes = require('./routes/incidents.routes');

// Create Express application
const app = express();

/**
 * MIDDLEWARE SETUP
 * Middleware runs in order, top to bottom, for every request
 */

// 1. CORS - Allow frontend to make requests to this API
// This is critical for local development where frontend and backend run on different ports
app.use(cors({
  origin: config.cors.origin, // e.g., http://localhost:5173 (Vite dev server)
  credentials: true,
}));

// 2. JSON Body Parser - Parse incoming JSON request bodies
// This makes req.body available in controllers
app.use(express.json());

// 3. Request Logger - Log every incoming request
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next(); // Pass control to next middleware
});

/**
 * ROUTES
 * Define all API endpoints
 */

// Health check endpoint - useful for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API root endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'AI Incident & Status Assistant API',
    version: '1.0.0',
    endpoints: {
      incidents: '/api/incidents',
      health: '/health',
    },
  });
});

// Mount incidents routes at /api/incidents
// All routes defined in incidentsRoutes will be prefixed with /api/incidents
app.use('/api/incidents', incidentsRoutes);

/**
 * ERROR HANDLING
 * These MUST come after all routes
 */

// 404 handler - catches requests to undefined routes
app.use(notFoundHandler);

// Global error handler - catches all errors thrown in the app
app.use(errorHandler);

/**
 * SERVER STARTUP
 * Connect to database, then start listening for requests
 */
async function startServer() {
  try {
    logger.info('=€ Starting AI Incident Assistant API...');

    // Test database connection
    logger.info('Testing database connection...');
    await db.testConnection();

    // Start HTTP server
    const PORT = config.port;
    app.listen(PORT, () => {
      logger.success(` Server running on http://localhost:${PORT}`);
      logger.info('Available endpoints:', {
        health: `http://localhost:${PORT}/health`,
        api: `http://localhost:${PORT}/api`,
        incidents: `http://localhost:${PORT}/api/incidents`,
      });
    });

  } catch (error) {
    logger.error('L Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1); // Exit with error code
  }
}

/**
 * GRACEFUL SHUTDOWN
 * Handle shutdown signals to close connections cleanly
 */
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await db.closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await db.closePool();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason,
    promise,
  });
  process.exit(1);
});

// Start the server
startServer();

// Export app for testing purposes
module.exports = app;
