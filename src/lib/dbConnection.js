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

/**
 * Verifies the database schema by executing a raw SQL query.
 * If the query is successful, it means the database is correctly configured.
 * If the query fails, it logs the error message and terminates the process.
 *
 * @async
 * @function
 * @throws Will throw an error if the database is not correctly configured.
 * @returns {void}
 */
export async function verifyDatabaseSchema() {
  try {
    // Execute a raw SQL query to select the first record from the 'detection' table
    const result = await dbKnex.raw('SELECT * FROM detection LIMIT 1')

    // If the query is successful, log a success message
    console.log('Database is correctly configured.')
  } catch (error) {
    // If the query fails, log the error message
    console.error('Database configuration error:', error.message)

    // Terminate the process if the database is not correctly configured
    process.exit(1)
  }
}

// Export both pool and knexInstance
export { dbKnex, checkKnexConnection }
