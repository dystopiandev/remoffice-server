const sockio = require('socket.io')
const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
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
const socketauth = require('socketio-auth')(server, {
  authenticate: function(socket, data, callback) {
    if (data.token !== null) {
      jwt.verify(data.token, appConfig.sessions.key, function (err, decoded) {
        if (err) {
          return callback(new Error('Invalid Token!'))
        } else {
          socket.client.user = decoded
          return callback(null, true)
        }
      })  
    } else {
      return callback(new Error('Token not found!'))
    }
  },
  timeout: appConfig.sessions.authTimeout	
})

module.exports = server