# Remoffice Server

> A server for IoT automations.

## Setup Guide

### Preparing the server (Raspberry Pi 3 procedure)

 1. Write Raspbian Stretch image to boot medium. Edit config.txt if necessary, then boot.

 2. Launch Pi config tool:

        sudo raspi-config

    - Boot Options > Desktop/CLI > Console Autologin

    - Boot Options > Wait for Network at Boot > Yes

    - Interfacing Options > SSH > Yes

    - OPTIONAL (If your local network is WiFi):
      
      Network Options > Wi-Fi, then supply Wi-Fi credentials
          
    - Finish (exit config tool), then reboot

  3. OPTIONAL (If you want to access the server by hostname as well as IP)

          sudo apt install insserv avahi-daemon
    
      Network Options > Hostname -> ```remoffice```

          sudo insserv avahi-daemon

          sudo /etc/init.d/avahi-daemon restart

 4. Get *Blackbox IP*:

        ip addr

 5. SSH into Pi:

        ssh pi@<Blackbox IP>

    - Default password is ```raspberry```

 5. Setup relay switching support:

        sudo nano /etc/modules

    - Add the following lines:

          i2c-bcm2708 
          i2c-dev

    - Make device writable:

          sudo chmod o+rw /dev/i2c*

 7. Configure autostart on boot for Remoffice Server by appending script to ```~/.bashrc```:
 
        nano ~/.bashrc

  >     if [[ "$(tty)" == "/dev/tty1" ]]; then
  >       clear && cd remoffice-server && node index.js &
  >     fi

 8. Install Node v8:
    
        curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
        
        sudo apt install -y nodejs

 9. Setup blackbox-specific tools:
     
         # install pslist package because we need rkill
         sudo apt install pslist
     
 10. Build and attach Remoffice Client:
     
     (Skip this step if you want to run in server-only mode. You must build and use external [Remoffice Client](https://github.com/r3dh4r7/remoffice-client) instance(s) to interact with the server.)
     
         # install Git CLI
         sudo apt install git

         # grab the latest version of Remoffice Client
         git clone https://github.com/r3dh4r7/remoffice-client

         # navigate to Remoffice Client root
         cd remoffice-client

         # install dependencies
         npm install

         # build Remoffice Client
         npm run build

         # exit Remoffice Client root
         cd ../

 11. Fetch and bootstrap Remoffice Server:
     
         # grab the latest version of Remoffice Server
         git clone https://github.com/r3dh4r7/remoffice-server

         # navigate to Remoffice Server root
         cd remoffice-server
         
         # install dependencies
         npm install

 12. Restart OS:
     
         sudo shutdown -r now


### Configuring the server

The server configuration file is ```remoffice-server/config/index.js```

Default config:

```javascript
{
  // Server name
  name: 'Remoffice Server',

  // Server verbosity
  enableLogs: true,

  // Client verbosity
  enableNotifications: true,

  // Database driver
  dbDriver: 'sqlite',

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

  // Database config
  db: {
    // SQLite
    sqlite: {
      index: 'database/sqlite/storage/index.sqlite'
    }
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
```


### Connecting to the Server

The server runs on port 8088 and can be accessed from any Remoffice Client exposed the network by default.

Note that if you setup Remoffice Server in server-only mode, you will not be served any content when you visit http://*< Blackbox IP >*:8088 but you can configure an external Remoffice Client to connect to the blackbox's IP address with the configured port.

Of course the server can also be accessed by hostname as "remoffice" if configured by the local network router or "remoffice.local" if you configure

Configure it to work as you want by editing the configuration file below.


### Customising the server

#### Modifying/Extending Rooms, Switches, Cams, etc.

By default, *./database/sqlite/storage/index.sqlite* houses the database content. You can use a tool like [SQLiteStudio](https://sqlitestudio.pl) to mutate the database.

#### Managing Central Storage

By default, *./blackbox/< configured blackbox >/storage* is mounted as Central Storage root. You can symlink an external file source to a sub-directory here.

Eample: symlinkinking an external hard drive

    crontab -e

>     sudo mount -o rw /dev/sdb1 /home/pi/remoffice-server/blackbox/raspberry-pi-3/storage/usb1```

#### Custom Blackbox Drivers
You can write a custom blackbox driver (for Odroid C2, Raspberry Pi 2, etc.) following a similar structure to *./blackbox/raspberry-pi-3* and extending the prototype class ```Blackbox``` in *./blackbox/_prototype/driver/index.js*

#### Custom Database Drivers
You can write a custom database driver (e.g. MySQL, MongoDB, etc) following a similar structure to *./database/sqlite*