/**
 * Simple Logger Utility
 *
 * Purpose: Provides consistent logging throughout the application
 * Used by: All backend modules for logging info, warnings, errors
 *
 * This is a simple logger for development. In production, you might
 * want to use a library like 'winston' or 'pino' for more features.
 */

const config = require('./env');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Formats a log message with timestamp and color
 */
function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;

  let logMessage = `${color}[${timestamp}] [${level.toUpperCase()}]${colors.reset} ${message}`;

  // If additional data is provided, stringify it
  if (data) {
    logMessage += `\n${colors.gray}${JSON.stringify(data, null, 2)}${colors.reset}`;
  }

  return logMessage;
}

const logger = {
  /**
   * Info level - general information
   * Example: logger.info('Server started on port 3001')
   */
  info: (message, data) => {
    console.log(formatMessage('blue', message, data));
  },

  /**
   * Error level - something went wrong
   * Example: logger.error('Database connection failed', error)
   */
  error: (message, data) => {
    console.error(formatMessage('red', message, data));
  },

  /**
   * Warning level - something unexpected but not critical
   * Example: logger.warn('API rate limit approaching')
   */
  warn: (message, data) => {
    console.warn(formatMessage('yellow', message, data));
  },

  /**
   * Success level - operation completed successfully
   * Example: logger.success('Incident created successfully')
   */
  success: (message, data) => {
    console.log(formatMessage('green', message, data));
  },

  /**
   * Debug level - detailed info for debugging
   * Only logs in development mode
   */
  debug: (message, data) => {
    if (config.nodeEnv === 'development') {
      console.log(formatMessage('gray', `[DEBUG] ${message}`, data));
    }
  },
};

module.exports = logger;
