require('dotenv').config({ path: './.env' })

module.exports = {
  // Determines whether the repeater should loop or not.
  loopRepeater: process.env.LOOP_REPEATER === 'true',

  // The file location of the repeater file.
  repeaterFileLocation: process.env.REPEATER_FILE_LOCATION,

  // The file location where the generated file will be saved.
  generatedFileLocation: process.env.GENERATED_FILE_LOCATION,
}
