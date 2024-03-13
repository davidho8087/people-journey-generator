const { readDir, csvToObject, writeToFile } = require('./utils/fileUtil')
const { getEventType } = require('./utils/peopleEventUtil')

const folderPathMunro = '../data/munro-people-event'
const folderPathVca = '../data/vca-people-event'

// Generated file paths
const munroGeneratedFilePath = '../data/munro-generated_v1.json'
const vcaGeneratedFilePath = '../data/vca-generated_v1.json'

/**
 * Array containing the headers for capacity data.
 * @type {string[]}
 */
const capacityHeaderArray = [
  'dateTime',
  'storeCode',
  'uuid',
  'trackerId',
  'eventName',
  'eventType',
  'region',
  'classType',
  'cameraName',
  'count',
  'message',
  'regionId',
  'zoneName',
  'brand',
]

/**
 * Array containing the headers for dwelling data.
 * @type {string[]}
 */
const dwellingHeaderArray = [
  'dateTime',
  'storeCode',
  'uuid',
  'trackerId',
  'eventType',
  'eventName',
  'duration',
  'classType',
  'cameraName',
  'region',
  'message',
  'regionId',
  'zoneName',
  'brand',
]

/**
 * Generates a JSON file based on the provided file contents and saves it to the specified file path.
 * @param {Array<Object>} fileContents - An array of file contents, each containing a fileContent and fileName property.
 * @param {string} generatedFilePath - The path where the generated JSON file will be saved.
 * @returns {Promise<void>} - A promise that resolves when the JSON file is successfully generated and saved.
 */
const generateJsonFile = async (fileContents, generatedFilePath) => {
  let results = []
  for (let fileInfo of fileContents) {
    const content = fileInfo.fileContent

    let payload = {}
    const eventType = getEventType(content)

    switch (eventType) {
      case 'dwell':
      case 'visit':
        payload = await csvToObject(dwellingHeaderArray, content.split(','))
        break
      case 'capacity':
        payload = await csvToObject(capacityHeaderArray, content.split(','))
        break
      default:
        console.log('Unknown event type')
        break
    }

    payload = { ...payload, fileName: fileInfo.fileName }
    delete payload.brand

    results.push(payload)
  }

  results.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))

  const dataToWrite = results.map((result) => JSON.stringify(result)).join('\n')
  await writeToFile(generatedFilePath, dataToWrite)
}

// Execute the main function
const main = async () => {
  const vcaFileContent = await readDir(folderPathVca)
  const munroFileContent = await readDir(folderPathMunro)

  await generateJsonFile(
    munroFileContent.fileInformation,
    munroGeneratedFilePath
  )
  await generateJsonFile(vcaFileContent.fileInformation, vcaGeneratedFilePath)
}

// Start
main()
