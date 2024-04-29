import { randomUUID } from 'crypto'
import { STORE_CODE, config, OPERATING_HOURS, TIME_ZONE } from '../../config.js'
import logger from '../lib/logger.js'
import { promises as fsPromises } from 'fs'
import { handleError } from '../utils/errorHandler.js'
import { sleep } from '../utils/util.js'
import { dbKnex } from '../lib/dbConnection.js'
import { toZonedTime } from 'date-fns-tz'
import {
  getDay,
  setHours,
  setMinutes,
  setSeconds,
  isWithinInterval,
  format as formatDate,
  parseISO,
  differenceInMilliseconds,
} from 'date-fns'

const loopRepeater = config.loopRepeater
const repeaterFileLocation = config.repeaterFileLocation
const generatedFileLocation = config.generatedFileLocation
const trackerIdPrefix = formatDate(new Date(), 'yyyyMMddHHmmss')

if (!repeaterFileLocation || !generatedFileLocation) {
  logger.error(
    'Please provide repeaterFileLocation and generatedFileLocation in the config file.'
  )
  process.exit(0)
}

/**
 * Cache for operating hours.
 * @type {null|Array}
 */
let cachedOperatingHours = null

/**
 * Retrieves the cached operating hours. If the operating hours are not already cached,
 * it calculates and caches them. The operating hours are calculated by mapping each day
 * to an object that includes the start and end times for that day.
 *
 * @function
 * @returns {Array} - The cached operating hours.
 */
function getCachedOperatingHours() {
  if (!cachedOperatingHours) {
    // Calculate and cache operating hours if not already cached
    cachedOperatingHours = OPERATING_HOURS.map((day) => {
      const [startHour, startMinute] = day.start.split(':').map(Number)
      const [endHour, endMinute] = day.end.split(':').map(Number)
      const startDate = setSeconds(
        setMinutes(setHours(new Date(), startHour), startMinute),
        0
      )
      const endDate = setSeconds(
        setMinutes(setHours(new Date(), endHour), endMinute),
        0
      )
      return { ...day, startDate, endDate }
    })
  }
  return cachedOperatingHours
}

/**
 * Checks if a given date is within the operating hours.
 *
 * This function first converts the given date to the specified timezone.
 * It then retrieves the day of the week for the converted date and finds the corresponding operating hours.
 * If no operating hours are found for the day, it returns false.
 * If operating hours are found, it checks if the time is within the start and end times for that day.
 *
 * @param {Date} date - The date to check.
 * @param {string} timeZone - The timezone to convert the date to.
 * @returns {boolean} - Returns true if the date is within the operating hours, false otherwise.
 */
function isInOperatingHours(date, timeZone) {
  const zonedDate = toZonedTime(date, timeZone)
  const dayOfWeek = getDay(zonedDate)
  const operatingDay = getCachedOperatingHours().find(
    (day) => day.day === dayOfWeek
  )
  console.log('Date provided:', date)
  console.log('Converted to timezone:', timeZone, zonedDate)
  console.log('Day of the week:', dayOfWeek)

  if (!operatingDay) {
    console.log('No operating hours set for this day:', dayOfWeek)
    return false // No operating hours set for this day
  }

  const { startDate, endDate } = operatingDay

  console.log('Calculated start date/time:', startDate)
  console.log('Calculated end date/time:', endDate)

  const isWithin = isWithinInterval(zonedDate, {
    start: startDate,
    end: endDate,
  })
  console.log('Is the current time within operating hours?', isWithin)

  return isWithin
}

/**
 * Saves a record to the database.
 *
 * This function first checks if the current time is within the operating hours.
 * If it is not within the operating hours, it logs a message and exits the function.
 * If it is within the operating hours, it creates a new record with a unique UUID, the store code,
 * the current date and time, and a tracker ID that includes the loop count and the original tracker ID.
 * It then attempts to insert the new record into the 'detection' table in the database.
 * If the insertion is successful, it logs a success message.
 * If the insertion fails, it logs an error message and throws the error.
 *
 * @async
 * @function
 * @param {Object} originalRecord - The original record to save.
 * @param {number} loopCount - The current loop count.
 * @throws Will throw an error if the record cannot be saved to the database.
 * @returns {void}
 */
async function saveRecord(originalRecord, loopCount) {
  const currentDateTime = new Date() // The current time
  if (!isInOperatingHours(currentDateTime, TIME_ZONE)) {
    console.log('Record not saved. Not within operating hours.')
    return // Exit if not within operating hours
  }

  console.log('originalRecord', originalRecord)

  const newRecord = {
    ...originalRecord,
    uuid: randomUUID(),
    storeCode: STORE_CODE,
    dateTime: new Date().toISOString(),
    trackerId: `${trackerIdPrefix}_${loopCount.toString()}_${originalRecord.trackerId}`,
  }

  try {
    await dbKnex('detection').insert({
      tracker_id: newRecord.trackerId,
      store_code: newRecord.storeCode,
      event_type: newRecord.eventType,
      event_name: newRecord.eventName,
      duration: newRecord.duration,
      class_type: newRecord.classType,
      region: newRecord.region,
      message: newRecord.message,
      date_time: newRecord.dateTime,
      camera_name: newRecord.cameraName,
      region_id: newRecord.regionId,
      zone_name: newRecord.zoneName,
    })
    logger.info('Record successfully saved', newRecord)
  } catch (error) {
    logger.error('Error saving record to database:', error)
    throw error
  }
}

/**
 * Processes the provided data.
 *
 * This function first splits the data into an array of strings, each representing a record.
 * It then enters a loop that continues as long as the 'loopRepeater' variable is true.
 * In each iteration of the loop, it processes each record in the array.
 * For each record, it parses the record into a JSON object and retrieves the date and time from the record.
 * If there is a previous date and time, it calculates the difference in milliseconds between the current and previous date and time.
 * It then sleeps for the calculated difference or 1 hour, whichever is less.
 * After sleeping, it logs the record and attempts to save it to the database.
 * It then sets the current date and time as the previous date and time for the next iteration.
 * After processing all records in the array, it sleeps for 1 hour and increments the loop count.
 *
 * @async
 * @function
 * @param {string} data - The data to process.
 * @throws Will throw an error if a record cannot be saved to the database.
 * @returns {void}
 */
async function processData(data) {
  const dataArrays = data.split('\n')
  let loopCount = 0
  let previousDateTime = null

  do {
    for (let stringRecord of dataArrays) {
      const record = JSON.parse(stringRecord)
      const recordDateTime = parseISO(record.dateTime)

      if (previousDateTime) {
        const diff = differenceInMilliseconds(recordDateTime, previousDateTime)
        await sleep(diff < 3600000 ? diff : 3600000)
      }

      logger.info('record', record)
      await saveRecord(record, loopCount)
      previousDateTime = recordDateTime
    }

    await sleep(3600000) // Sleep for 1 hour
    loopCount++
  } while (loopRepeater)
}

/**
 * Reads the repeater file and processes its data.
 *
 * This function first reads the repeater file at the provided location.
 * It then processes the data from the file.
 * If an error occurs while reading the file or processing the data, it handles the error and throws it.
 *
 * @async
 * @function
 * @param {string} repeaterFileLocation - The location of the repeater file to read.
 * @throws Will throw an error if the file cannot be read or the data cannot be processed.
 * @returns {void}
 */
async function readRepeaterFile(repeaterFileLocation) {
  try {
    const data = await fsPromises.readFile(repeaterFileLocation, 'utf8')
    await processData(data)
  } catch (error) {
    handleError(error, 'readRepeaterFile. Error reading file')
    throw error
  }
}

export { readRepeaterFile }
