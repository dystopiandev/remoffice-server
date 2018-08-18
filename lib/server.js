const sockio = require('socket.io')
const express = require('express')
const cors = require('cors')
const router = require('./router')
const appConfig = require('../config')
const log = require('./log')
const bootStatus = require('./bootSequence')

// init webserver
const app = express()      

// enable CORS
app.use(cors({
  optionsSuccessStatus: 200
}))

// attach router
app.use(router)

// init socket server
const server = sockio.listen(app.listen(appConfig.socket.port, appConfig.socket.host))

module.exports = server