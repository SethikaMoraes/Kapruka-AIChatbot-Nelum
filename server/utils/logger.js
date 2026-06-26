/**
 * Server-side Logging Utility
 */
import { SERVER_CONFIG } from '../config/server.config.js';

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Default log level: DEBUG in development, WARN in production
let currentLogLevel = LOG_LEVELS.DEBUG;

if (process.env.NODE_ENV === 'production') {
  currentLogLevel = LOG_LEVELS.WARN;
}

export const logger = {
  debug(...args) {
    if (currentLogLevel <= LOG_LEVELS.DEBUG) {
      console.log('[DEBUG]', ...args);
    }
  },
  info(...args) {
    if (currentLogLevel <= LOG_LEVELS.INFO) {
      console.log('[INFO]', ...args);
    }
  },
  warn(...args) {
    if (currentLogLevel <= LOG_LEVELS.WARN) {
      console.warn('[WARN]', ...args);
    }
  },
  error(...args) {
    if (currentLogLevel <= LOG_LEVELS.ERROR) {
      console.error('[ERROR]', ...args);
    }
  }
};

export default logger;
