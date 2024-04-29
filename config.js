import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const environment = process.env.NODE_ENV || 'development'

const envFile = `.env.${environment}`
dotenv.config({ path: envFile })

// Default Settings
const envConfig = {
  port: process.env.PORT || 8002,
  environment,
}

const STORE_CODE = process.env.STORE_CODE

// Convert the import.meta.url to a directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// SSL Configuration
const sslConfig = JSON.parse(process.env.USE_SSL_CERT ?? 'false')
  ? {
      rejectUnauthorized: false,
      cert: fs.readFileSync(
        path.resolve(__dirname, '../pg-ca-certificate.crt'),
        'utf8'
      ),
    }
  : undefined

// PostgresSQL Connection Settings
const dbConfig = {
  client: 'postgresql',
  pool: {
    min: 2,
    max: 10,
    // Add resilience parameters
    acquireTimeoutMillis: 30000, // Time to wait for a connection from the pool
    idleTimeoutMillis: 5000, // Close idle connections after 5s
    createTimeoutMillis: 10000, // Time to wait when creating a new connection
    createRetryIntervalMillis: 200, // Retry interval for creating new connection
    propagateCreateError: false, // Avoids crashing on initial connection failure
  },
  connection: {
    database: process.env.PG_DBNAME,
    user: process.env.PG_USERNAME,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOSTNAME,
    port: process.env.PG_PORT || 5432,
    ssl: sslConfig,
  },
}

const config = {
  loopRepeater: process.env.LOOP_REPEATER === 'true',
  repeaterFileLocation: process.env.REPEATER_FILE_LOCATION,
  generatedFileLocation: process.env.GENERATED_FILE_LOCATION,
}

const TIME_ZONE = 'Asia/Hong_Kong'
const OPERATING_HOURS = [
  { day: 1, start: '09:00', end: '22:00' }, // Monday
  { day: 2, start: '00:00', end: '22:00' }, // Tuesday
  { day: 3, start: '09:00', end: '22:00' }, // Wednesday
  { day: 4, start: '09:00', end: '22:00' }, // Thursday
  { day: 5, start: '09:00', end: '22:00' }, // Friday
  { day: 6, start: '09:10', end: '22:00' }, // Saturday
  { day: 0, start: '09:10', end: '22:00' }, // Sunday
]
export { config, dbConfig, envConfig, STORE_CODE, TIME_ZONE, OPERATING_HOURS }
