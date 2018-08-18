const appConfig = require('../config')
const driver = appConfig.blackbox.driver ? appConfig.blackbox.driver : '_prototype'
const Blackbox = require('../blackbox/' + driver + '/driver')

module.exports = new Blackbox()
