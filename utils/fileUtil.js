const fs = require('fs')
const path = require('path')

/**
 * Reads a file asynchronously and invokes the callback function with the file data.
 * @param {string} filePath - The path of the file to be read.
 * @param {function} callback - The callback function to be invoked with the file data.
 * @returns {Promise<void>} - A promise that resolves when the file is read successfully.
 */
const readFile = async (filePath, callback) => {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    callback(data)
  })
}

/**
 * Reads the contents of a directory and returns information about each file.
 * @param {string} folderPath - The path to the directory.
 * @returns {Promise<Object>} - A promise that resolves to an object containing information about each file in the directory.
 * @throws {Error} - If there is an error reading the folder.
 */
const readDir = (folderPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        console.error('Error reading folder:', err)
        reject(err)
        return
      }

      let fileInformation = []
      files.forEach((file) => {
        const filePath = path.join(folderPath, file)
        const fileData = {
          fileName: file,
          fileContent: fs.readFileSync(filePath, 'utf8'),
        }

        fileInformation.push(fileData)
      })

      resolve({ fileInformation })
    })
  })
}

/**
 * Writes data to a file.
 *
 * @param {string} filePath - The path of the file to write to.
 * @param {string} data - The data to write to the file.
 * @returns {Promise<void>} - A promise that resolves when the file is written successfully, or rejects with an error.
 */
const writeToFile = async (filePath, data) => {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.error('Error writing payload to file:', err)
    } else {
      console.log(`Payload written to file: ${filePath}`)
    }
  })
}

/**
 * Converts CSV data into an object.
 * @param {Array<string>} headerArrays - The array of CSV header values.
 * @param {Array<string>} contentArrays - The array of CSV content values.
 * @returns {Promise<Object>} The converted object.
 */
const csvToObject = async (headerArrays, contentArrays) => {
  const obj = {}
  headerArrays.map((h, i) => {
    obj[h] = contentArrays[i] ? contentArrays[i].trim() : null
  })

  return obj
}


/**
 * Converts an object to a CSV string.
 * @param {Object} obj - The object to convert.
 * @param {boolean} [includeHeader=true] - Whether to include the header row in the CSV string.
 * @returns {string} The CSV string representation of the object.
 */
const objectToCsv = (obj, includeHeader = true) => {
  const keys = Object.keys(obj)
  const values = Object.values(obj)
  const csvRows = []

  if (includeHeader) {
    csvRows.push(keys.join(','))
  }

  csvRows.push(values.join(','))

  return csvRows.join('\n')
}

module.exports = { readFile, readDir, writeToFile, csvToObject, objectToCsv }
