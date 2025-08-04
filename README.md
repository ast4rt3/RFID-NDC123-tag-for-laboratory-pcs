# RFID NDC123 Laboratory PC Logger

A cross-platform application for tracking laboratory PC usage and application activity, using RFID authentication and real-time logging to a central server.

---

## Table of Contents

- [Features](#features)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Local Logging](#local-logging)
- [Server API](#server-api)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

---

## Features

- **Tracks PC session times** (start/stop) for each laboratory computer.
- **Monitors active application usage** (app name, duration, memory, CPU, GPU).
- **Logs data to a MySQL database via a Node.js/Express server.**
- **WebSocket-based real-time communication** between clients and server.
- **Electron-based client** with a simple timer UI and background logger.
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
  - Windows OS (for full feature support, e.g., GPU stats)
  - RFID reader hardware (optional, for authentication)

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
## Usage