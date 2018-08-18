const exec = require('child_process').exec
const appConfig = require('../../../config')
const db = require('../../../lib/db')
const server = require('../../../lib/server')
const clients = require('../../../lib/clients')
const notify = require('../../../lib/notify')
const log = require('../../../lib/log')
const ipAddresses = require('../../../lib/ipAddresses')
const serverVersion = require('../../../lib/serverVersion')

class Blackbox {
  constructor () {}

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
      'Name': 'Virtual Blackbox',
      'Model': 'Prototype',
      'Description': 'A virtual blackbox that does literally nothing.',
      'OS': 'Virtual OS'
    }
  }

  up () {
    let instance = this

    return new Promise((resolve) => {
      resolve('Prototype blackbox ready...')
    })
  }

  dispatchActions (clientId) {
    let instance = this
    let client = clients[clientId]

    // broadcast server data to client
    setInterval(() => {
      client.emit('serverData', instance.runtimeData)
    }, 500)
  }

  set (obj) {
    log.warning(JSON.stringify(obj))
  }

  reboot (delay) {
    return new Promise((resolve) => {
      resolve(delay)
    })
  }

  shutdown (delay) {
    return new Promise((resolve) => {
      resolve(delay)
    })
  }
}

module.exports = Blackbox
