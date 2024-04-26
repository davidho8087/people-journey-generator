import { randomUUID } from 'crypto'
import { STORE_CODE, config, OPERATING_HOURS, TIME_ZONE } from '../../config.js'
import logger from '../lib/logger.js'
import { promises as fsPromises } from 'fs'
import { handleError } from '../utils/errorHandler.js'
import { sleep } from '../utils/util.js'
import { dbKnex } from '../lib/dbConnection.js'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'
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

console.log('TIME_ZONE', TIME_ZONE)
console.log('OPERATING_HOURS', OPERATING_HOURS)

if (!repeaterFileLocation || !generatedFileLocation) {
  logger.error(
    'Please provide repeaterFileLocation and generatedFileLocation in the config file.'
  )
  process.exit(0)
}

function isInOperatingHours(date, timeZone) {
  const zonedDate = toZonedTime(date, timeZone)
  const dayOfWeek = getDay(zonedDate)
  const operatingDay = OPERATING_HOURS.find((day) => day.day === dayOfWeek)

  console.log('Date provided:', date)
  console.log('Converted to timezone:', timeZone, zonedDate)
  console.log('Day of the week:', dayOfWeek)

  if (!operatingDay) {
    console.log('No operating hours set for this day:', dayOfWeek)
    return false // No operating hours set for this day
  }

  const [startHour, startMinute] = operatingDay.start.split(':').map(Number)
  const [endHour, endMinute] = operatingDay.end.split(':').map(Number)

  console.log(
    'Operating start time:',
    operatingDay.start,
    'Parsed as:',
    startHour,
    startMinute
  )
  console.log(
    'Operating end time:',
    operatingDay.end,
    'Parsed as:',
    endHour,
    endMinute
  )

  const startDate = setSeconds(
    setMinutes(setHours(zonedDate, startHour), startMinute),
    0
  )
  const endDate = setSeconds(
    setMinutes(setHours(zonedDate, endHour), endMinute),
    0
  )

  console.log('Calculated start date/time:', startDate)
  console.log('Calculated end date/time:', endDate)

  const isWithin = isWithinInterval(zonedDate, {
    start: startDate,
    end: endDate,
  })
  console.log('Is the current time within operating hours?', isWithin)

  return isWithin
}

async function saveRecord(originalRecord, loopCount) {
  const currentDateTime = new Date() // The current time
  if (!isInOperatingHours(currentDateTime, TIME_ZONE)) {
    console.log('Record not saved. Not within operating hours.')
    return // Exit if not within operating hours
  }

  const newRecord = {
    ...originalRecord,
    uuid: randomUUID(),
    storeCode: STORE_CODE,
    dateTime: new Date().toISOString(),
    trackerId: `${trackerIdPrefix}_${loopCount.toString()}_${originalRecord.trackerId}`,
  }

  try {
    await dbKnex('detection').insert(newRecord)
    logger.info('Record successfully saved', newRecord)
  } catch (error) {
    logger.error('Error saving record to database:', error)
    throw error
  }
}

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
