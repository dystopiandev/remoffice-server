const appConfig = require('../config')
let driver = appConfig.blackbox.driver ? appConfig.blackbox.driver : '_prototype'
const Database = require('../database/' + driver + '/driver')

module.exports = new Database()