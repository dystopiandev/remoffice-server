const chalk = require('chalk')
const appConfig = require('./config')

module.exports = {
  success: function(...args) {
    if (appConfig.enableLogs)
      console.warn(chalk.green.bgBlack(...args))
  },

  info: function(...args) {
    if (appConfig.enableLogs)
      console.warn(chalk.blue.bgBlack(...args))
  },

  warning: function(...args) {
    if (appConfig.enableLogs)
      console.warn(chalk.yellow.bgBlack(...args))
  },

  error: function(...args) {
    if (appConfig.enableLogs)
      console.warn(chalk.red.bgBlack(...args))
  },

  neutral: function(...args) {
    if (appConfig.enableLogs)
      console.warn(chalk.white.bgBlack(...args))
  },

  inverted: function(...args) {
    if (appConfig.enableLogs)
      console.warn(chalk.black.bgWhite(...args))
  }
}