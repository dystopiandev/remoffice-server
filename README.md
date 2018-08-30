# Remoffice Server

<br />

## Table of Contents

* [Introduction](#introduction)
  * [Screenshot](#screenshot)
  * [Features](#features)
* [Setup Guide](#setup-guide)
  * [Raspberry Pi 3](#raspberry-pi-3)
* [Configuring to the Server](#configuring-the-server)
* [Connecting to the Server](#connecting-to-the-server)
* [Customising the server](#customising-the-server)
  * [Modifying/Extending Rooms, Switches, Cams, etc.](#modifyingextending-rooms-switches-cams-etc)
  * [Managing Shared Storage](#managing-shared-storage)
  * [Custom Blackbox Drivers](#custom-blackbox-drivers)
  * [Custom Database Drivers](#custom-database-drivers)

<br />

## Introduction

Remoffice Server is a multi-featured all-in-one Internet of Things (IoT) and remote control suite. It is designed with a standalone [client](https://git.dualsight.io/r3dh4r7/remoffice-client) that makes it fast and painless to deploy and remotely control connected infrastructure.

### Screenshot

![[Remoffice Server]](./resources/screenshots/remoffice-server.png)

### Features
Remoffice Server is developed in a flexible fashion, such that it can be adapted to anyone's taste. Its feature base is modular and can be altered for additions or stripdowns. It comes with an authentication system - suitable for enterprise setups where there are limitations to user privileges and prevention of unauthorised access to attached infrastructure.

The following features are pre-loaded in the Raspberry Pi 3 driver:
  - Power manager (remote toggling of switches) - this requires an Arduino UNO R3 (I/O slave)
  - In-browser file sharing.
  - Surveillance - polls IP cams for live feed.

<br />

## Setup Guide

### Raspberry Pi 3

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
    - ```raspberrypi``` should be replaced with the real IP address if you can extract it from your router or ```ip addr``` command if the Pi is connected to a monitor and keyboard.

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

 5. Install dependencies and get ready:
     
         # install Git CLI
         sudo apt install git
         
         # install pslist package because we need rkill
         sudo apt install pslist

         # install Node v8
         curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
         sudo apt install -y nodejs

         # ensure you're in user home
         cd ~
     
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

 9. Configure Remoffice Server:
     
         cp ~/remoffice-server/.env.example ~/remoffice-server/.env
         nano ~/remoffice-server/.env
      
      Ensure that ```BLACKBOX_DRIVER``` is set to ```raspberry-pi-3``` and see [below](#configuring-the-server) for further configuration details.

 10. Restart OS:
     
         sudo reboot

<br />

## Configuring the server

The server configuration is housed in the ```.env``` file.


|Config|Default|Description|
|-----|-----|-----|
|APP_NAME|Remoffice Server|The server will be identified in logs and by clients with this name.|
|SESSION_KEY|secret|A secret string that will be used by hashing functions.|
|SESSION_AUTH_TIMEOUT|10|Specifies how long (in seconds) the server will wait for a client to authenticate with valid user credentials before disconnecting the client.|
|SESSION_LIFETIME|86440|Specifies how long (in seconds) tokens issued by the server will be valid.|
|ENABLE_CLIENT_NOTIFICATIONS|1|Toggles notifications for connected clients.|
|ENABLE_SERVER_LOGS|1|Toggles loffing to console instance from where Remoffice was launched.|
|ENABLE_BLACKBOX_BROADCAST|1|Whether or not to reveal details about the blackbox.|
|CLIENT_PATH|../remoffice-client/dist|Specifies a path to a built Remoffice Client bundle.|
|SERVER_HOST|0.0.0.0|Host for HTTP and socket server modules.|
|SERVER_PORT|8088|Mount port for server.|
|BLACKBOX_DRIVER|(blank)|Specifies which blackbox drivers to load, based on hardware and database choices.|
|BLACKBOX_LOCATION|Planet Mars|A description of the blackbox's physical location in the building (useful for enterprise locations)|
|STORAGE_HOST|0.0.0.0|Host for storage server module.|0.0.0.0|
|STORAGE_PORT|8089|Port for storage server module.|8089|

<br />

## Connecting to the Server

The server runs on port 8088 and by default can be accessed from any JavaScript-enabled web browser on any device exposed to the network that houses the server. This can be configured to your preference.

Note that if you setup Remoffice Server in server-only mode, you will not be served any content when you visit http://*< Server IP >*:8088 but you can configure an external Remoffice Client to connect to the blackbox's IP address with the configured port.

Of course the server can also be accessed by hostname. If you did set the hostname to "remoffice" as instructed above, then your server should be accessible via ```remoffice:8088``` on any Remoffice Client instance.

See [Remoffice Client](https://git.dualsight.io/r3dh4r7/remoffice-client) documentation for more details on how to connect to Remoffice Server.

<br />

## Customising the server

### Modifying/Extending Rooms, Switches, Cams, etc.

For example, *./database/raspberry-pi-3/storage/index.sqlite* houses the database content for the Raspberry Pi 3 driver. You can use a tool like [SQLiteStudio](https://sqlitestudio.pl) to mutate the database.

### Managing Shared Storage

By default, *./blackbox/< configured blackbox >/storage* is mounted as Blackbox Storage root. You can symlink external disks/file sources to sub-directories here.

Eample: symlinking an external hard disk

    crontab -e

>     sudo mount -o rw /dev/sdb1 /home/pi/remoffice-server/blackbox/raspberry-pi-3/storage/usb1```

### Custom Blackbox Drivers
You can write a custom blackbox driver (for Odroid C2, Raspberry Pi 2, etc.) following a similar structure to *./blackbox/raspberry-pi-3* and extending the prototype class ```Blackbox``` in *./blackbox/_prototype/driver/index.js*

### Custom Database Drivers
You can write a custom database driver (e.g. MySQL, MongoDB, etc) following a similar structure to *./database/raspberry-pi-3*