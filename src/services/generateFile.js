import { randomUUID } from 'crypto'
import { STORE_CODE, config } from '../../config.js'
import dayjs from 'dayjs'
import logger from '../lib/logger.js'
import { promises as fsPromises } from 'fs'
import { handleError } from '../utils/errorHandler.js'
import { sleep } from '../utils/util.js'
import { dbKnex } from '../lib/dbConnection.js'

const loopRepeater = config.loopRepeater
const repeaterFileLocation = config.repeaterFileLocation
const generatedFileLocation = config.generatedFileLocation
const trackerIdPrefix = dayjs().format('YYYYMMDDHHmmss')

async function saveRecord(originalRecord, loopCount) {
  // Create a new record object with updated properties, keeping originalRecord immutable
  const newRecord = {
    ...originalRecord,
    uuid: randomUUID(),
    storeCode: STORE_CODE,
    dateTime: dayjs().toISOString(),
    trackerId: `${trackerIdPrefix}_${loopCount.toString()}_${originalRecord.trackerId}`,
  }

  // Save record using dbKnex
  try {
    // Assuming your table is named 'detection'
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

if (!repeaterFileLocation || !generatedFileLocation) {
  logger.error(
    'Please provide repeaterFileLocation and generatedFileLocation in the config file.'
  )
  process.exit(0)
}

async function processData(data) {
  const dataArrays = data.split('\n')

  let loopCount = 0
  do {
    let previousDateTime = null
    for (let stringRecord of dataArrays) {
      const record = JSON.parse(stringRecord)
      // logger.info('record', record)
      const recordDateTime = dayjs(record.dateTime)

      if (previousDateTime) {
        const diff = recordDateTime.diff(previousDateTime, 'millisecond')
        await sleep(diff < 60 * 60 * 1000 ? diff : 60 * 60 * 1000)
      }

      // await generateRecord(record, loopCount)
      await saveRecord(record, loopCount)

      previousDateTime = recordDateTime
    }

    await sleep(60 * 60 * 1000)
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

// We are not using this function.
// We set aside for future reference

// async function generateRecord(record, loopCount) {
//   const fileNamePart = record.fileName.split('_')
//   const cameraName = fileNamePart[2]
//   const eventType = fileNamePart[3]

//   record.uuid = randomUUID()
//   record.dateTime = dayjs().toISOString()
//   record.trackerId = `${trackerIdPrefix}_${loopCount.toString()}_${record.trackerId}`
//   delete record.fileName

//   const csvRecord = objectToCsv(record, false)

//   const fileName = `DEMO_${record.storeCode}_${cameraName}_${eventType}_${dayjs(record.dateTime).format('DD_MM_YYYY_HH-mm-ss-SSS')}.csv`
//   // Insert Record here
//   await writeToFile(`${generatedFileLocation}/${fileName}`, csvRecord)
// }

// if (!repeaterFileLocation || !generatedFileLocation) {
//   logger.error(
//     'Please provide repeaterFileLocation and generatedFileLocation in the config file.'
//   )
//   process.exit(0)
// }
