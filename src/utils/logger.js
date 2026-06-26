/**
 * Nelum AI Unified Logging Wrapper
 */
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Default log level: DEBUG in development, WARN in production
let currentLogLevel = LOG_LEVELS.DEBUG;

if (isNode) {
  if (process.env.NODE_ENV === 'production') {
    currentLogLevel = LOG_LEVELS.WARN;
  }
} else if (typeof window !== 'undefined') {
  // Client environment production checks
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    currentLogLevel = LOG_LEVELS.WARN;
  }
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
  },
  setLevel(levelName) {
    const lvl = LOG_LEVELS[levelName.toUpperCase()];
    if (lvl !== undefined) {
      currentLogLevel = lvl;
    }
  }
};

export default logger;
