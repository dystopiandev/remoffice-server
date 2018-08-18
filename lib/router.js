const fs = require('fs')
const express = require('express')
const router = express.Router({ mergeParams: true })
const appConfig = require('../config')
const log = require('./log')

// check if internal client is properly configured and attach
if ((appConfig.client.buildDir.length > 0) && fs.existsSync(appConfig.client.buildDir)) { // yeah?
  router.use('/', express.static(appConfig.client.buildDir))
}

// attach server assets
let driver = appConfig.blackbox.driver ? appConfig.blackbox.driver : '_prototype'
router.use('/server-assets/blackbox/images', express.static('./blackbox/' + driver + '/meta/images/'))

module.exports = router