require('dotenv').config()

module.exports = {
  // Server name
  name: process.env.APP_NAME ? process.env.APP_NAME : 'Remoffice Server',

  // Session config
  sessions: {
    key: process.env.SESSION_KEY ? process.env.SESSION_KEY : 'A Secret 4lph4num3r1c String',
    authTimeout: process.env.SESSION_AUTH_TIMEOUT ? Number.parseInt(process.env.SESSION_AUTH_TIMEOUT) : 10000, // seconds to wait for client to authenticate
    expiry: Number.parseInt(process.env.SESSION_LIFETIME) ? process.env.SESSION_LIFETIME : 86440 // token life in seconds
  },

  // Server verbosity
  enableLogs: process.env.ENABLE_SERVER_LOGS ? Number.parseInt(process.env.ENABLE_SERVER_LOGS) : false,

  // Client verbosity
  enableNotifications: process.env.ENABLE_CLIENT_NOTIFICATIONS ? Number.parseInt(process.env.ENABLE_CLIENT_NOTIFICATIONS) : false,

  // Blackbox config
  blackbox: {
    driver:  process.env.BLACKBOX_DRIVER ? process.env.BLACKBOX_DRIVER : '',
    location: process.env.BLACKBOX_LOCATION ? process.env.BLACKBOX_LOCATION : 'Computer Laboratory',
    exposeToClients: process.env.ENABLE_BLACKBOX_BROADCAST ? Number.parseInt(process.env.ENABLE_BLACKBOX_BROADCAST) : false
  },
  
  // Web socket interface
  socket: {
    host: process.env.SERVER_HOST ? process.env.SERVER_HOST : '0.0.0.0',
    port: process.env.SERVER_PORT ? process.env.SERVER_PORT : '8088'
  },

  // Internal client build dir
   client: {
    buildDir: process.env.CLIENT_PATH ? process.env.CLIENT_PATH : ''
  },
  
  // Storage server config
  storage: {
    host: process.env.STORAGE_HOST ? process.env.STORAGE_HOST : '0.0.0.0',
    port: process.env.STORAGE_PORT ? process.env.STORAGE_PORT : '8089'
  },


}
