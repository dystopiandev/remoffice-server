const appConfig = require('./config')
const blackbox = require('./lib/blackbox')
const log = require('./lib/log')
const notify = require('./lib/notify')
const bootStatus = require('./lib/bootSequence')
const server = require('./lib/server')
const ipAddresses = require('./lib/ipAddresses')
const serverVersion = require('./lib/serverVersion')
const jwt = require('jsonwebtoken')

// kick-off
log.inverted('', appConfig.name, serverVersion, '\n')
log.success(bootStatus(), 'Server now listening on port', appConfig.socket.port)

// open and wait for db
blackbox.db.connect()
  .then((dbResponse) => {
    log.success(bootStatus(), dbResponse)

    // wait for blackbox
    blackbox.up()
      .then((readyMsg) => {
        log.success(bootStatus(), readyMsg)
        log.neutral('\n')

        // socket auth middleware
        const socketauth = require('socketio-auth')(server, {
          // try authenticating client
          authenticate: function(clientSocket, data, callback) {
            if (data.token !== null) {
              jwt.verify(data.token, appConfig.sessions.key, function (err, decoded) {
                if (err) {
                  return callback(new Error('Invalid Token!'))
                } else {
                  clientSocket.client.user = decoded
                  return callback(null, true)
                }
              })  
            } else {
              return callback(new Error('Token not found!'))
            }
          },
          // after authenticating successfully...
          postAuthenticate: (clientSocket) => {
            const user = clientSocket.client.user
            const userTag = user.firstName + ' ' + user.lastName + ' #' + user.id

            // announce new client
            log.success('[' + clientSocket.handshake.address + ']', '>', 'Authentication success! Client ID: #' + clientSocket.id)

            // introduce the new guy to all online users
            notify.info(server, userTag, 'Connected', 3000)

            // increase client count
            blackbox.runtimeData.server.clientCount++

            // broadcast server data to client
            setInterval(() => {
              clientSocket.emit('serverData', blackbox.runtimeData)
            }, 500)

            // fire away
            blackbox.dispatchActions(clientSocket)
          },
          // catch all disconnections
          disconnect: (clientSocket) => {
            const user = clientSocket.client.user
            const userTag = user.firstName + ' ' + user.lastName + ' #' + user.id

            // detect disconnections due to auth timeout
            if (!clientSocket.auth) {
              log.warning('[' + clientSocket.handshake.address + ']', '>', 'Authentication timeout.')
            } else {
              log.warning('[' + clientSocket.handshake.address + ']', '>', 'User #' + clientSocket.client.user.id, 'left.')

              // wave goodbye to all online users
              notify.info(server, userTag, 'Disconnected', 3000)
            }

            // decrease client count
            blackbox.runtimeData.server.clientCount--
          },
          timeout: appConfig.sessions.authTimeout
        })

        // event watch: socket connection established
        server.on('connection', (clientSocket) => {
          log.info('[' + clientSocket.handshake.address + ']', '>', 'New authentication attempt...')
        })
      })
      // if blackbox couldn't start (I hope not) for some reason
      .catch((bbError) => {
        log.error(bootStatus(), bbError, '\n')
      })
  })
  // if database connection failed, give up
  .catch((dbError) => {
    log.error(bootStatus(), dbError, '\n')
  })

// handle other exceptions
process.on('uncaughtException', function(err) {
  if(err.errno === 'EADDRINUSE')
    log.error('FATAL ERROR:', 'The configured port is in-use by another process.', '\n')
  else
    log.error('FATAL ERROR:', err, '\n')
  process.exit(0)
})