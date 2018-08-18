const exec = require('child_process').exec
const Blackbox = require('../../_prototype/driver')
const appConfig = require('../../../config')
const db = require('../../../lib/db')
const server = require('../../../lib/server')
const clients = require('../../../lib/clients')
const notify = require('../../../lib/notify')
const log = require('../../../lib/log')
const ipAddresses = require('../../../lib/ipAddresses')
const serverVersion = require('../../../lib/serverVersion')

class RaspberryPi3 extends Blackbox {
  constructor () {
    super()
    this.processes = {}
  }

  get runtimeData () {
    return {
      ipAddresses: ipAddresses.toArray(),
      blackbox: appConfig.blackbox.exposeToClients ? {
        status: 'running',
        location: appConfig.blackbox.location,
        metadata: this.metadata
      } : false,
      server: {
        name: appConfig.name,
        version: serverVersion,
        clientCount: Object.keys(clients).length
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
      db.fetchSwitches()
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

  dispatchActions (clientId) {
    let instance = this
    let client = clients[clientId]

    // broadcast server data to client
    setInterval(() => {
      client.emit('serverData', instance.runtimeData)
    }, 500)

    // feed this client
    db.fetchRooms()
      .then((rooms) => client.emit('rooms', rooms))
      .catch((err) => log.error(err))
    db.fetchMasterSwitches()
      .then((masterSwitches) => client.emit('masterSwitches', masterSwitches))
      .catch((err) => log.error(err))
    db.fetchSwitches()
      .then((switches) => client.emit('switches', switches))
    db.fetchCams()
      .then((cams) => client.emit('cams', cams))
      .catch((err) => log.error(err))

    client.on('disconnect', () => {
      log.warning('[' + client.handshake.address + ']', '>', 'Client #' + clientId, 'left.')
      delete clients[clientId]  // untrack client
    })

    client.on('getServerData', () => {
      log.info('[Client #' + clientId + ']', '>', 'Request: Server Data')
      server.emit('serverData', runtimeData)
    })

    client.on('getRooms', () => {
      log.info('[Client #' + clientId + ']', '>', 'Request: Rooms')
      db.fetchRooms()
        .then((rooms) => client.emit('rooms', rooms))
        .catch((err) => log.error(err))
    })

    client.on('getCams', () => {
      log.info('[Client #' + clientId + ']', '>', 'Request: Cameras')
      db.fetchCams()
        .then((cams) => client.emit('cams', cams))
        .catch((err) => log.error(err))
    })

    client.on('getSwitches', () => {
      log.info('[Client #' + clientId + ']', '>', 'Request: Switches')
      db.fetchSwitches()
        .then((switches) => client.emit('switches', switches))
        .catch((err) => log.error(err))
    })
  
    client.on('getMasterSwitches', () => {
      log.info('[Client #' + clientId + ']', '>', 'Request: Master Switches')
      db.fetchMasterSwitches()
        .then((masterSwitches) => client.emit('masterSwitches', masterSwitches))
        .catch((err) => log.error(err))
    })
  
    client.on('toggleSwitch', (dataNode) => {
      const stateText = dataNode.state ? 'ON' : 'OFF'
      db.updateSwitch(dataNode.id, dataNode.state ? 1 : 0)
        .then(() => {
          instance.setSwitch(dataNode)
          log.info('[Client #' + clientId + ']', '>', 'Toggle Switch', '#' + dataNode.id, stateText)
          notify.info(server, 'Blackbox Dispatch', 'Switch #' + dataNode.id + ' toggled ' + stateText + '!', 3000)
          db.fetchSwitches()
            .then((switches) => server.emit('switches', switches))
            .catch((err) => log.error(err))
        })
        .catch((err) => log.error(err))
    })
  
    client.on('toggleMasterSwitch', (dataNode) => {
      const stateText = dataNode.state ? 'ON' : 'OFF'
      db.updateMasterSwitch(dataNode.id, dataNode.state ? 1 : 0)
        .then(() => {
          instance.setMasterSwitch(dataNode)
          log.info('[Client #' + clientId + ']', '>', dataNode.title, stateText)
          notify.info(server, 'Blackbox Dispatch', dataNode.title + ' toggled ' + stateText + '!', 3000)
          db.fetchMasterSwitches()
            .then((masterSwitches) => server.emit('masterSwitches', masterSwitches))
            .catch((err) => log.error(err))
        })
    })
  
    client.on('rebootBlackbox', (delay) => {
      runtimeData.blackbox.status = 'rebooting'  // set blackbox runtime status
      log.info('[Client #' + clientId + ']', '>', 'Rebooting Blackbox', (delay == 'now') ? 'immediately...' : 'in ' + delay + 's...')
      notify.warning(server, 'Server Event', 'Rebooting...', 0)
      instance.reboot(delay)
        .then()
        .catch((err) => log.error(err))
    })
  
    client.on('shutdownBlackbox', (delay) => {
      runtimeData.blackbox.status = 'stopped'  // set blackbox runtime status
      log.info('[Client #' + clientId + ']', '>', 'Shutting down', (delay == 'now') ? 'immediately...' : 'in ' + delay + 's...')
      notify.red(server, 'Server Shutdown', 'To re-establish connection, you have to manually restart the blackbox.', 0)
      instance.shutdown(delay)
        .then()
        .catch((err) => log.error(err))
    })
  }

  async setMasterSwitch (ms) {
    let instance = this

    switch (ms.name) {
      case 'storageServer':
        switch (ms.state ? 1 : 0) {
          case 0:
            if (typeof this.processes.storageServer !== 'undefined') {
              exec('sudo rkill ' + this.processes.storageServer.pid)
              log.warning('[' + instance.metadata['Name'] + ']', '>', 'Storage server stopped.')
            }
            break

          case 1:
            const cmd = 'sudo node node_modules/bossa/index.js -l ' + appConfig.storage.host + ' -p ' + appConfig.storage.port + ' blackbox/' + appConfig.blackbox.driver + '/storage/'
            this.processes.storageServer = exec(cmd)
            this.processes.storageServer.stdout.on('data', () => {
              log.success('[' + instance.metadata['Name'] + ']', '>', 'Storage server listening on port', appConfig.storage.port)
            })
            this.processes.storageServer.on('exit', () => {
              delete this.processes.storageServer
            })
            break
        }
        break
    
      default:
        break
    }
  }

  async setSwitch (s) {

  }

}

module.exports = RaspberryPi3
