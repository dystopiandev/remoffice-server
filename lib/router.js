const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')
const router = express.Router({ mergeParams: true })
const appConfig = require('../config')
const log = require('./log')
const authenticate = require('./authenticate')

router.use(bodyParser.json())
router.use(bodyParser.urlencoded({extended: true}))

// check if internal client is properly configured and attach
if ((appConfig.client.buildDir.length > 0) && fs.existsSync(appConfig.client.buildDir)) { // yeah?
  router.use('/', express.static(appConfig.client.buildDir))
}

// attach server assets
let driver = appConfig.blackbox.driver ? appConfig.blackbox.driver : '_prototype'
router.use('/server-assets/blackbox/images', express.static('./blackbox/' + driver + '/meta/images/'))

// auth route
router.post('/auth', function(req, res) {
	var email = req.body.email
  var password =req.body.password

  authenticate(email, password)
    .then(function (user) {
      var token = jwt.sign(user, appConfig.sessions.key, {
        expiresIn: appConfig.sessions.expiry
      })
      
      res.json({ error: false, message: 'Access granted! Redirecting...', token: token })
    })
    .catch(function (err) {
      res.json({ error: true, message: err.message})
    })
})

module.exports = router