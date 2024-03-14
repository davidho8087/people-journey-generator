import * as dotenv from 'dotenv'

import app from './server.js'
import * as Service from './services/generateFile.js'
import { checkKnexConnection } from './lib/dbConnection.js'
import logger from './lib/logger.js'
import { config, envConfig, STORE_CODE } from '../config.js'
import { handleError } from './utils/errorHandler.js'

dotenv.config()

const port = envConfig.port
const environment = envConfig.environment

// Function to handle post-connection tasks
async function onDatabaseConnected() {
  const repeaterFileLocation = config.repeaterFileLocation
  console.log('repeaterFileLocation', repeaterFileLocation)
  // any function execute after database connection
  await Service.readRepeaterFile(repeaterFileLocation)
  // Start the server
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`)
    logger.info(`Server is running in ${environment} mode`)
    logger.info(`http://localhost:${port}`)
  })
}

app.listen(port, () => {
  console.log(`Server is running on port ${port} for STORE_CODE: ${STORE_CODE}`)
  logger.info(`Server is running in ${environment} mode`)
  logger.info(`http://localhost:${port}`)
})

// Check database connection before starting the server
checkKnexConnection()
  .then((isConnected) => {
    if (isConnected) {
      onDatabaseConnected().catch((error) => {
        handleError(
          error,
          'checkKnexConnection. Error during post-database connection tasks'
        )
        process.exit(1)
      })
    } else {
      logger.error('Failed to establish database connection. Exiting...')
      process.exit(1)
    }
  })
  .catch((error) => {
    handleError(
      error,
      `checkKnexConnection. Error during database check: ${error.message}`
    )
    process.exit(1)
  })
