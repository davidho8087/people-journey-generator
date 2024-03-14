import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import logger from '../lib/logger.js'

function readFile(filePath, callback) {
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }

    callback(data)
  })
}

function readDir(folderPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, (err, files) => {
      if (err) {
        logger.error('Error reading folder:', err)
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

async function writeToFile(filePath, data) {
  try {
    await fsPromises.writeFile(filePath, data)
    logger.info(`Payload written to file: ${filePath}`)
  } catch (error) {
    logger.error(`Error writing payload to file: ${error}`)
    throw error
  }
}

async function csvToObject(headerArrays, contentArrays) {
  const obj = {}
  headerArrays.map((h, i) => {
    obj[h] = contentArrays[i] ? contentArrays[i].trim() : null
  })

  return obj
}

function objectToCsv(obj, includeHeader = true) {
  const keys = Object.keys(obj)
  const values = Object.values(obj)
  const csvRows = []

  if (includeHeader) {
    csvRows.push(keys.join(','))
  }

  csvRows.push(values.join(','))

  return csvRows.join('\n')
}

export { readFile, readDir, writeToFile, csvToObject, objectToCsv }
