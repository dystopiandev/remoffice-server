const sqlite = require('sqlite')
const appConfig = require('../../../config')

class Database {
  constructor () {
    this.db = null
  }

  // connection

  connect () {
    let instance = this
    
    return new Promise((resolve, reject) => {
      Promise.all([
        sqlite.open('database/' + appConfig.blackbox.driver + '/storage/index.sqlite', { Promise, cached: true }),
      ])
        .then(function([db]){
          instance.db = db
          resolve('Established connection to database!')
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  // Fetches

  fetchUserByEmail (email) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM User WHERE email=?', email)
      .then((data) => resolve(data))
      .catch((err) => reject(err))
    })
  }

  fetchMasterSwitches () {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM MasterSwitch')
        .then((data) => resolve(data))
        .catch((err) => reject(err))
    })
  }

  fetchRooms () {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM Room')
        .then((data) => resolve(data))
        .catch((err) => reject(err))
    })
  }

  fetchSwitches () {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM Switch')
        .then((data) => resolve(data))
        .catch((err) => reject(err))
    })
  }

  fetchCams () {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM Cam')
        .then((data) => resolve(data))
        .catch((err) => reject(err))
    })
  }

  // Updates

  updateSwitch (id, state) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE Switch SET state=? WHERE id=?', [state, id])
      .then((data) => resolve(data))
      .catch((err) => reject(err))
    })
  }

  updateMasterSwitch (id, state) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE MasterSwitch SET state=? WHERE id=?', [state, id])
      .then((data) => resolve(data))
      .catch((err) => reject(err))
    })
  }
}

module.exports = Database