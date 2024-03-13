const dayjs = require('dayjs')
const { readFile, objectToCsv, writeToFile } = require('./utils/fileUtil')
const { sleep } = require('./utils/util')
const { randomUUID } = require('crypto')
const config = require('./config')

const loopRepeater = config.loopRepeater
const repeaterFileLocation = config.repeaterFileLocation
const generatedFileLocation = config.generatedFileLocation

const trackerIdPrefix = dayjs().format('YYYYMMDDHHmmss')

/**
 * Generates a record based on the provided data and loop count.
 * @param {Object} record - The record object containing the data.
 * @param {number} loopCount - The loop count value.
 * @returns {void}
 */
const generateRecord = (record, loopCount) => {
  const fileNamePart = record.fileName.split('_')
  const cameraName = fileNamePart[2]
  const eventType = fileNamePart[3]

  record.uuid = randomUUID()
  record.dateTime = dayjs().toISOString()
  record.trackerId = `${trackerIdPrefix}_${loopCount.toString()}_${record.trackerId}`
  delete record.fileName

  const csvRecord = objectToCsv(record, false)

  const fileName = `DEMO_${record.storeCode}_${cameraName}_${eventType}_${dayjs(record.dateTime).format('DD_MM_YYYY_HH-mm-ss-SSS')}.csv`

  // Insert Record here

  writeToFile(`${generatedFileLocation}/${fileName}`, csvRecord)
}

if (!repeaterFileLocation || !generatedFileLocation) {
  console.error(
    'Please provide repeaterFileLocation and generatedFileLocation in the config file.'
  )
  process.exit(0)
}

/**
 * Processes the given data by splitting it into arrays, iterating over each record,
 * generating a new record, and waiting for a specified time interval between each record.
 *
 * @param {string} data - The data to be processed.
 * @returns {Promise<void>} - A promise that resolves when the processing is complete.
 */
const processData = async (data) => {
  const dataArrays = data.split('\n')

  let loopCount = 0
  do {
    let count = 0
    let previousDateTime = null
    for (let stringRecord of dataArrays) {
      const record = JSON.parse(stringRecord)
      console.log(record)
      const recordDateTime = dayjs(record.dateTime)
      console.log(recordDateTime)

      if (previousDateTime) {
        console.log('previousDateTime', previousDateTime)
        const diff = recordDateTime.diff(previousDateTime, 'millisecond')
        await sleep(diff < 60 * 60 * 1000 ? diff : 60 * 60 * 1000)
      }

      generateRecord(record, loopCount)

      previousDateTime = recordDateTime
      count++
    }

    await sleep(60 * 60 * 1000)
    loopCount++
  } while (loopRepeater)
}

// Execute function
readFile(repeaterFileLocation, processData)
