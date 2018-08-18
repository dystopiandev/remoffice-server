module.exports = {
  // Server name
  name: 'Remoffice Server',

  // Server verbosity
  enableLogs: true,

  // Client verbosity
  enableNotifications: true,

  // Blackbox config
  blackbox: {
    driver:  'raspberry-pi-3', // leave empty for emulation
    location: 'Computer Laboratory',
    exposeToClients: true
  },
  
  // Web socket interface
  socket: {
    host: '0.0.0.0',
    port: '8088'
  },

  // Internal client build dir
   client: {
    buildDir: '../remoffice-client/dist'  // leave empty for server-only mode
  },
  
  // Storage server config
  storage: {
    host: '0.0.0.0',
    port: '8089'
  }
}
