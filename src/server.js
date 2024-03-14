// server.js
import express from 'express'
import logger from './lib/logger.js'

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.get('/', (req, res) => {
  res.send('This is hardware app service')
})
// Updated error handling middleware
app.use((err, req, res) => {
  logger.error(err)
  res.status(500).json({ message: `An error occurred: ${err.message}` })
})

export default app
