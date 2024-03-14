import logger from '../lib/logger.js'

export const handleError = (props) => {
  const { error, source } = props
  logger.error(`Error in ${source}:`, error.message)
  logger.error('Full-Error:', error)
}
