import logger from '../lib/logger.js';

// Define handleError to accept individual parameters
export const handleError = (error, source) => {
  const message = error && error.message ? error.message : 'No error message available';
  logger.error(`Error in ${source}:`, message);
  if (error) {
    logger.error('Full-Error:', error);
  } else {
    logger.error('Full-Error: Error object is undefined');
  }
}
