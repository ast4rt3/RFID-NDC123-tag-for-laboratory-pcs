# RFID NDC123 Laboratory PC Logger

A cross-platform application for tracking laboratory PC usage and application activity, using RFID authentication and real-time logging to a central server.

---

## Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Useful Commands](#Useful-Commands)

---

## Features

- **Tracks PC session times** (start/stop) for each laboratory computer.
- **Monitors active application usage** (app name, duration, memory, CPU).
- **Logs data to a MySQL database via a Node.js/Express server.**
- **WebSocket-based real-time communication** between clients and server.
- **Electron-based client** background logger.
- **Configurable server IP and port** for flexible deployment.
- **Local log file** for each client for redundancy and debugging.

---

## System Requirements

- **Server:**
  - Node.js (v14+ recommended)
  - MySQL Server (e.g., via XAMPP)
- **Client:**
  - Node.js (for development or running unpackaged)
  - Electron (for GUI)
  - Windows OS (for full feature support, e.g.)
  - RFID reader hardware (to display reports)

---

## Installation

### 1. Clone the Repository

```sh
git clone https://github.com/your-org/RFID-NDC123-tag-for-laboratory-pc.git
cd RFID-NDC123-tag-for-laboratory-pc
```

### 2. Install Dependencies

```sh
npm install
cd client
npm install
cd ../server
npm install
```

### 3. Set Up the Database

- Start XAMPP and launch phpMyAdmin.
- Import the provided database schema (see /server/db.sql or your own schema file).
- Ensure the database name is juglone (or update in server/server.js).

## Configuration
 
 ### Server
 - Edit database credentials in server/server.js if needed.

 #### To start the server
 ```
node server/server.js
```

 ### Client
 - On first run, the client will prompt for the server IP.
 - You can find the clients ip if you run 
     ``` ipconfig```
     on any CLI
 - Or, manually edit client/config.json (see README-CONFIG.md):

 ```
 {
  "serverIP": "192.168.1.100",
  "serverPort": 8080
}
```
---
## Troubleshooting
- ### Cannot connect to server:
     - Check server IP and port in ```config.json.```
     - Ensure server is running and firewall allows ports 3000 (API) and 8080 (WebSocket).
- ### Database errors:
     - Verify MySQL is running and credentials are correct.
     - Check that the ```juglone``` database and required tables exist.
- ### Client not logging:
     - Check ```rfid-client-debug.log``` for errors
     - Ensure Node.js and Electron are installed.

## Development 
- client code: ```client/```
- server code: ```server/```
- Configuration: ```client/config.js```, ```client/README-CONFIG.md```
- Main entry points:
     - Client: ```client/main.js```
     - Server: ```server/server.js```

## Useful-Commands

#### Starting Server
```
node server/server.js
```
#### Running client application on CLI
```
npx electron client/main.js
```
#### Building the client application
```
npm run build-installer
```
#### My Directory
```
cd C:\Users\law\Documents\JuglonProject\RFID-NDC123-tag-for-laboratory-pc
```
