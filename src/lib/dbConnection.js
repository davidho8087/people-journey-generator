// dbConnection.js
import knex from 'knex'
import { dbConfig } from '../../config.js'
import logger from './logger.js'

const dbKnex = knex(dbConfig)

async function checkKnexConnection(attempt = 1) {
  const maxAttempts = 10
  try {
    const result = await dbKnex.raw('SELECT NOW()')
    logger.debug(
      'Knex connection established, current time:',
      result.rows[0].now
    )
    return true
  } catch (error) {
    logger.error(
      `Attempt ${attempt}: Error establishing Knex connection:`,
      error.message
    )
    if (attempt < maxAttempts) {
      const waitTime = attempt * 60 * 1000 // Wait time increases with each attempt
      logger.info(`Waiting ${waitTime / 1000} seconds before retrying...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      return checkKnexConnection(attempt + 1)
    } else {
      return false
    }
  }
}

// Export both pool and knexInstance
export { dbKnex, checkKnexConnection }
