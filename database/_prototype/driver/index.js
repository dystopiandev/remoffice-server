const sqlite = require('sqlite')
const appConfig = require('../../../lib/config')

class Database {
  constructor () {
    this.db = null
  }

  // connection

  connect () {
    let instance = this
    
    return new Promise((resolve) => {
      resolve('Established connection to database!')
    })
  }
}

module.exports = Database