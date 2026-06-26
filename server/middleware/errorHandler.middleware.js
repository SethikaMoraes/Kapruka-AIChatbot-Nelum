/**
 * Express Error Handler Middleware
 */
import { logger } from '../utils/logger.js';

export function errorHandlerMiddleware(err, req, res, next) {
  logger.error(`[Express Error Handler] caught exception:`, err.message || err);
  
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error'
  });
}

export default errorHandlerMiddleware;
