const exec = require('child_process').exec
const appConfig = require('../../../lib/config')
const db = require('../../../lib/db')
const server = require('../../../lib/server')
const clients = require('../../../lib/clients')
const notify = require('../../../lib/notify')
const log = require('../../../lib/log')
const ipAddresses = require('../../../lib/ipAddresses')
const serverVersion = require('../../../lib/serverVersion')

class Blackbox {
  constructor () {
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

  dispatchActions (clientSocket) {
    let instance = this
    const user = clientSocket.client.user
    const userTag = user.firstName + ' ' + user.lastName + ' #' + user.id
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
