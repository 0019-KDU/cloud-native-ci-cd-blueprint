/**
 * Global Error Handler Middleware
 *
 * Purpose: Catches all errors thrown in the application and sends proper HTTP responses
 * Used by: index.js (registered as the last middleware)
 *
 * How it works:
 * 1. When any controller or service throws an error, it gets passed to next(error)
 * 2. Express automatically routes errors to middleware with 4 parameters (err, req, res, next)
 * 3. This middleware formats the error and sends an appropriate HTTP response
 * 4. In development, it includes stack traces; in production, it hides them
 *
 * This prevents your API from crashing and ensures consistent error responses
 */

const logger = require('../config/logger');
const config = require('../config/env');

/**
 * Global error handler
 * MUST have 4 parameters (err, req, res, next) for Express to recognize it as error middleware
 */
function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Error caught by global handler', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Determine status code
  // If error has a statusCode property, use it; otherwise default to 500
  const statusCode = err.statusCode || 500;

  // Determine error message
  // In production, hide internal error details for security
  const message = config.nodeEnv === 'production' && statusCode === 500
    ? 'An internal server error occurred'
    : err.message;

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      message,
      statusCode,
    },
  };

  // Include stack trace only in development for debugging
  if (config.nodeEnv === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * This catches requests to routes that don't exist
 * Should be registered BEFORE the error handler but AFTER all valid routes
 */
function notFoundHandler(req, res) {
  logger.warn('404 Not Found', {
    url: req.url,
    method: req.method,
  });

  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.url}`,
      statusCode: 404,
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
