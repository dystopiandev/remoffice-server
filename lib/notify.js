const appConfig = require('../config')

module.exports = {
  success: (io, title, text, duration, delay = 0) => {
    if (appConfig.enableNotifications) {
      io.emit('notification', {
        type: 'success',
        title: title,
        text: text,
        duration: duration,
        delay: delay
      })
    }
  },
  info: (io, title, text, duration, delay = 0) => {
    if (appConfig.enableNotifications) {
      io.emit('notification', {
        type: 'info',
        title: title,
        text: text,
        duration: duration,
        delay: delay
      })
    }
  },
  warning: (io, title, text, duration, delay = 0) => {
    if (appConfig.enableNotifications) {
      io.emit('notification', {
        type: 'warning',
        title: title,
        text: text,
        duration: duration,
        delay: delay
      })
    }
  },
  error: (io, title, text, duration, delay = 0) => {
    if (appConfig.enableNotifications) {
      io.emit('notification', {
        type: 'error',
        title: title,
        text: text,
        duration: duration,
        delay: delay
      })
    }
  },
  red: (io, title, text, duration, delay = 0) => {
    if (appConfig.enableNotifications) {
      io.emit('notification', {
        type: 'error',
        title: title,
        text: text,
        duration: duration,
        delay: delay
      })
    }
  }
}