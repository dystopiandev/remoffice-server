const appConfig = require('../../../config')
const exec = require('child_process').exec
const i2c = require('i2c')
const wire = new i2c(appConfig.switchController.address, {device: appConfig.switchController.device})
const Blackbox = require('../../_prototype/driver')
const db = require('../../../lib/db')
const server = require('../../../lib/server')
const notify = require('../../../lib/notify')
const log = require('../../../lib/log')
const ipAddresses = require('../../../lib/ipAddresses')
const serverVersion = require('../../../lib/serverVersion')

class RaspberryPi3 extends Blackbox {
  constructor () {
    super()
    this.processes = {}
    this.runtimeData = {
      ipAddresses: ipAddresses.toArray(),
      blackbox: appConfig.blackbox.exposeToClients ? {
        status: 'running',
        location: appConfig.blackbox.location,
        metadata: this.metadata
      } : false,
      server: {
        name: appConfig.name,
        version: serverVersion,
        clientCount: 0
      },
      servlets: {
        storage: {
          port: appConfig.storage.port
        }
      }
    }
  }

  get db () {
    return db
  }

  get metadata () {
    return {
      'Name': 'Raspberry Pi',
      'Model': '3B',
      'Description': 'An ARM-based credit card sized SBC (Single Board Computer) created by Raspberry Pi Foundation.',
      'OS': 'Debian 9.0 (Stretch)'
    }
  }

  reboot (delay) {
    var cmd = 'sudo pkill node ; sudo pkill uv4l ; sudo shutdown -r now'
    cmd = (delay == 'now') ? cmd : 'sleep ' + delay + 's; ' + cmd
    
    return new Promise((resolve, reject) => {
      const rebootSequence = exec(cmd)
      rebootSequence.addListener('error', reject)
      rebootSequence.addListener('exit', resolve)
    })
  }

  shutdown (delay) {
    var cmd = 'sudo pkill node ; sudo pkill uv4l ; sudo shutdown now'
    cmd = (delay == 'now') ? cmd : 'sleep ' + delay + 's; ' + cmd

    return new Promise((resolve, reject) => {
      const rebootSequence = exec(cmd)
      rebootSequence.addListener('error', reject)
      rebootSequence.addListener('exit', resolve)
    })
  }

  up () {
    let instance = this

    return new Promise((resolve) => {
      db.fetchAllSwitches()
        .then((switches) => {
          for (let i = 0; i < switches.length; i++) {
            instance.setSwitch(switches[i])
          }
        })
        .catch((err) => log.error(err))

      db.fetchMasterSwitches()
        .then((masterSwitches) => {
          for (let i = 0; i < masterSwitches.length; i++) {
            instance.setMasterSwitch(masterSwitches[i])
          }
        })
        .catch((err) => log.error(err))
      resolve(instance.metadata['Name'] + ' (' + instance.metadata['Model'] + ') running on ' + instance.metadata['OS'])
    })
  }

  dispatchActions (clientSocket) {
    let instance = this
    const user = clientSocket.client.user
    const userTag = user.firstName + ' ' + user.lastName + ' #' + user.id

    // feed this client initially
    clientSocket.emit('updateRooms')
    clientSocket.emit('updateMasterSwitches')
    clientSocket.emit('updateSwitches')
    clientSocket.emit('updateCams')

    clientSocket.on('getServerData', () => {
      server.emit('serverData', instance.runtimeData)
    })

    clientSocket.on('getRooms', () => {
      db.fetchRooms()
        .then((rooms) => clientSocket.emit('rooms', rooms))
        .catch((err) => log.error(err))
    })

    clientSocket.on('getCams', () => {
      db.fetchCams()
        .then((cams) => clientSocket.emit('cams', cams))
        .catch((err) => log.error(err))
    })

    clientSocket.on('getSwitches', () => {
      if (user.privilege >= 1) {
        db.fetchAllSwitches()
          .then((switches) => clientSocket.emit('switches', switches))
          .catch((err) => log.error(err))
      } else {
        db.fetchSwitches(user.Room_id)
          .then((switches) => clientSocket.emit('switches', switches))
          .catch((err) => log.error(err))
      }
    })
  
    clientSocket.on('getMasterSwitches', () => {
      db.fetchMasterSwitches()
        .then((masterSwitches) => clientSocket.emit('masterSwitches', masterSwitches))
        .catch((err) => log.error(err))
    })

    // mutations
  
    clientSocket.on('toggleSwitch', (dataNode) => {
      const user = clientSocket.client.user

      db.fetchSwitchRoomId(dataNode.id)
        .then((roomId) => {
          db.userBelongsToRoom(user.id, roomId)
            .then((indeed) => {
              if (indeed || user.privilege >= 1) {
                const stateText = dataNode.state ? 'ON' : 'OFF'
        
                db.updateSwitch(dataNode.id, dataNode.state ? 1 : 0)
                  .then(() => {
                    // update the switch
                    instance.setSwitch(dataNode)
                    // log to console if turned on
                    log.info('[User #' + clientSocket.client.user.id + ']', '>', 'Toggle Switch', '#' + dataNode.id, stateText)
                    // broadcast event to all connected clients except self
                    notify.info(clientSocket.broadcast, userTag, 'Toggled ' + stateText + ' Switch #' + dataNode.id, 3000)
                    // command all clients to refresh switches
                    server.emit('updateSwitches')
                  })
                  .catch((err) => log.error(err))
              } else {
                db.fetchSwitches(user.Room_id)
                  .then((switches) => clientSocket.emit('switches', switches))
                  .catch((err) => log.error(err))
                notify.error(clientSocket, 'Server Guard', 'Infrastructure does not belong in your room!', 3000)
              }
            })
            .catch((err) => log.error(err))
        })
    })
  
    clientSocket.on('toggleMasterSwitch', (dataNode) => {
      const stateText = dataNode.state ? 'ON' : 'OFF'

      if (user.privilege >= 1) {
        db.updateMasterSwitch(dataNode.id, dataNode.state ? 1 : 0)
          .then(() => {
            // update the master switch
            instance.setMasterSwitch(dataNode)
            // log to console if turned on
            log.info('[User #' + clientSocket.client.user.id + ']', '>', dataNode.title, stateText)
            // broadcast event to all connected clients except self
            notify.info(clientSocket.broadcast, userTag, 'Toggled ' + stateText + ' ' + dataNode.title, 3000)
            // command all clients to update master switches
            server.emit('updateMasterSwitches')
          })
      } else {
        db.fetchMasterSwitches()
          .then((masterSwitches) => clientSocket.emit('masterSwitches', masterSwitches))
          .catch((err) => log.error(err))
        notify.error(clientSocket, 'Server Guard', 'You need elevated privileges to toggle Master Switches', 3000)
      }
    })
  
    clientSocket.on('rebootBlackbox', (delay) => {
      instance.runtimeData.blackbox.status = 'rebooting'  // set blackbox runtime status
      log.info('[User #' + clientSocket.client.user.id + ']', '>', 'Rebooting Blackbox', (delay == 'now') ? 'immediately...' : 'in ' + delay + 's...')
      notify.warning(server, 'Server Event', 'Rebooting...', 0)
      instance.reboot(delay)
        .then()
        .catch((err) => log.error(err))
    })
  
    clientSocket.on('shutdownBlackbox', (delay) => {
      instance.runtimeData.blackbox.status = 'stopped'  // set blackbox runtime status
      log.info('[User #' + clientSocket.client.user.id + ']', '>', 'Shutting down', (delay == 'now') ? 'immediately...' : 'in ' + delay + 's...')
      notify.red(server, 'Server Shutdown', 'To re-establish connection, you have to manually restart the blackbox.', 0)
      instance.shutdown(delay)
        .then()
        .catch((err) => log.error(err))
    })
  }

  async setMasterSwitch (ms) {
    let instance = this

    switch (ms.name) {
      case 'blackboxStorage':
        switch (ms.state ? 1 : 0) {
          case 0:
            if (typeof this.processes.blackboxStorage !== 'undefined') {
              exec('sudo rkill ' + this.processes.blackboxStorage.pid)
              log.warning('[' + instance.metadata['Name'] + ']', '>', 'Storage server stopped.')
            }
            break

          case 1:
            const cmd = 'sudo node node_modules/bossa/index.js -l ' + appConfig.storage.host + ' -p ' + appConfig.storage.port + ' blackbox/' + appConfig.blackbox.driver + '/storage/'
            this.processes.blackboxStorage = exec(cmd)
            this.processes.blackboxStorage.stdout.on('data', () => {
              log.success('[' + instance.metadata['Name'] + ']', '>', 'Storage server listening on port', appConfig.storage.port)
            })
            this.processes.blackboxStorage.on('exit', () => {
              delete this.processes.blackboxStorage
            })
            break
        }
        break
    
      default:
        break
    }
  }

  async setSwitch (s) {
    wire.writeBytes(s.state, [s.id], function (err) {
      if (err) log.error(err)
    })
  }

}

module.exports = RaspberryPi3
