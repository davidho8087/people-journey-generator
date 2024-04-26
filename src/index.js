import dotenv from 'dotenv'
import app from './server.js'
import * as Service from './services/generateFile.js'
import {
  checkKnexConnection,
  verifyDatabaseSchema,
} from './lib/dbConnection.js'
import logger from './lib/logger.js'
import { config, envConfig, STORE_CODE } from '../config.js'
import { handleError } from './utils/errorHandler.js'

dotenv.config()

const { port, environment } = envConfig

async function onDatabaseConnected() {
  try {
    const repeaterFileLocation = config.repeaterFileLocation
    logger.info(`repeaterFileLocation: ${repeaterFileLocation}`)
    await Service.readRepeaterFile(repeaterFileLocation)
    startServer()
  } catch (error) {
    handleError(error, 'Error during post-database connection tasks')
    process.exit(1)
  }
}

function startServer() {
  app
    .listen(port, () => {
      logger.info(
        `Server is running on port ${port} for STORE_CODE: ${STORE_CODE}`
      )
      logger.info(`Server is running in ${environment} mode`)
      logger.info(`http://localhost:${port}`)
    })
    .on('error', (err) => {
      logger.error(`Failed to start the server: ${err.message}`)
      process.exit(1)
    })
}

async function init() {
  try {
    await verifyDatabaseSchema()
    const isConnected = await checkKnexConnection()
    if (isConnected) {
      await onDatabaseConnected()
      startServer()
    } else {
      logger.error('Failed to establish database connection. Exiting...')
      process.exit(1)
    }
  } catch (error) {
    handleError(error, `Error during database check: ${error.message}`)
    process.exit(1)
  }
}

init()
