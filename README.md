# Remoffice Server

> A server for IoT automations.

## Setup Guide

### Preparing the server (Raspberry Pi 3 procedure)

 1. Write Raspbian Stretch image to boot medium, create an empty file called ```ssh``` in the boot partition. Also, if you're to use Wi-Fi, create a file called ```wpa_supplicant.conf``` in the same directory with the following content:

		country=US
		ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
		update_config=1

		network={
			ssid="YOUR WIFI SSID"
			scan_ssid=1 psk="YOUR WIFI PASSWORD"
			key_mgmt=WPA-PSK
		}

 2. Launch a terminal instance and SSH into the Pi:
		
		ssh pi@raspberrypi

    - Default password is ```raspberry```
    - ```raspberrypi``` should be replaced with the real IP address if you can extract it from your router or ```ip addr``` command if the Pi is plugged into a monitor.

 3. Launch Pi config tool:

        sudo raspi-config

    - Boot Options > Desktop/CLI > Console Autologin

    - Interfacing Options > I2C > Yes

    - (OPTIONAL) > Boot Options > Wait for Network at Boot > Yes

    - OPTIONAL (If you want to access the server by hostname as well as IP) > Network Options > Hostname -> ```remoffice```
          
    - Finish (exit config tool), reboot, then SSH into the Pi again.

 4. You may need to get a fresh mirror from [here](https://www.raspbian.org/RaspbianMirrors), then replace the default mirror:

         sudo nano /etc/apt/sources.list.d/raspi.list
    
    Run ```sudo apt update``` right after the change.

 5. Install dependencies:
     
         # install Git CLI
         sudo apt install git
         
         # install pslist package because we need rkill
         sudo apt install pslist

         # install Node v8
         curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
         sudo apt install -y nodejs
     
 6. Build Remoffice Client:
     
     (Skip this step if you want to run in server-only mode. You must build and use external [Remoffice Client](https://git.dualsight.io/r3dh4r7/remoffice-client) instance(s) to interact with the server.)

         # grab the latest version of Remoffice Client
         git clone https://git.dualsight.io/r3dh4r7/remoffice-client

         # navigate to Remoffice Client root
         cd remoffice-client

         # install dependencies
         npm install

         # build Remoffice Client
         npm run build

         # exit Remoffice Client root
         cd ../

 7. Fetch and bootstrap Remoffice Server:
     
         # grab the latest version of Remoffice Server
         git clone https://git.dualsight.io/r3dh4r7/remoffice-server

         # navigate to Remoffice Server root
         cd remoffice-server
         
         # install dependencies
         npm install
      *** Installation might span a couple of minutes since some libraries would be built from source.

 8. Configure autostart on boot for Remoffice Server by appending script to ```~/.bashrc```:
 
         nano ~/.bashrc

    >     if [[ "$(tty)" == "/dev/tty1" ]]; then
    >       clear && cd remoffice-server && node index.js &
    >     fi

 9. Restart OS:
     
         sudo reboot


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