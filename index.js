const appConfig = require('./config')
const blackbox = require('./lib/blackbox')
const log = require('./lib/log')
const notify = require('./lib/notify')
const bootStatus = require('./lib/bootSequence')
const server = require('./lib/server')
const clients = require('./lib/clients')
const ipAddresses = require('./lib/ipAddresses')
const serverVersion = require('./lib/serverVersion')
const makeId = require('./lib/makeId')

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

        // event watch: socket connection established
        server.on('connection', (client) => {
          const clientId = makeId(5) // make client ID
          clients[clientId] = client // track client

          // announce new client
          log.success('[' + client.handshake.address + ']', '>', 'New client! ID: #' + clientId)
          notify.success(server, 'Server Event', 'New client handshake!', 3000)  // introduce the new guy

          blackbox.dispatchActions(clientId)
        })
    })
      .catch((bbError) => {
        log.error(bootStatus(), bbError, '\n')
      })
  })
  .catch((dbError) => {
    log.error(bootStatus(), dbError, '\n')
  })

process.on('uncaughtException', function(err) {
  if(err.errno === 'EADDRINUSE')
    log.error('FATAL ERROR:', 'The configured port is in-use by another process.', '\n')
  else
    log.error('FATAL ERROR:', err, '\n')
  process.exit(0)
})