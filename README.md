##
Mega download link on application
```
https://mega.nz/file/daN1XJba#Z-qM5J4neYWUhx5SzoLNNBi_MvvkxQNA8X9Pvhqbd68
```
Server
```
https://mega.nz/folder/IP0AFT4Y#L14v1sdtwFW38PL5V3py3Q
```
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
# 🖥️ System Monitoring and Management Tool

A comprehensive **PC monitoring, analytics, and reporting system** designed for real-time tracking of application usage, browser activity, system resources, and cloud-based data management.

---

## 🖥️ Core Monitoring Features

### 📊 Application Usage Tracking
- Real-time active window monitoring  
- Application session tracking (start/end times)  
- Duration calculation for precise usage  
- Application name and process ID detection  
- Memory, CPU, and GPU usage tracking  
- Configurable monitoring intervals for optimization  


### ⏱️ Session Management
- PC session start/stop tracking  
- Session duration calculation  
- Session-based resource usage tracking  
- Automatic session detection  

---

## 🗄️ Database & Storage Features

### 📋 Data Storage
- sqlite local database integration  
- Supabase PostgreSQL cloud support  
- Multi-provider compatibility (AWS RDS, Google Cloud SQL, PlanetScale)  
- Database migration, backup, and restore tools  

### 📊 Database Tables
- `time_logs` – Session start/end and duration  
- `app_usage_logs` – Application usage and metrics  
- `browser_search_logs` – Browser activity and search queries  
- Indexed tables, unique constraints, and auto-incrementing IDs  

### 🔍 Database Views & Reporting
- `app_daily_summary` – Daily app usage summaries  
- `pc_session_resource_avg` – Average session resource usage  
- `pc_session_resource_summary` – Total session resource summary  
- Real-time data queries for live reporting  

---

## 🌐 Web Dashboard Features

### 📱 Dashboard Interface
- Modern, responsive UI (mobile-friendly)  
- Real-time data visualization (Chart.js integration)  
- Tabbed interface for apps and search activity  
- Professional gradient styling and Font Awesome icons  

### 📊 Data Visualization
- Application and search engine distribution charts  
- Summary statistics cards and key metrics  
- Interactive date and PC filters  
- Real-time data fetching from the database  

### 📈 Reporting Features
- App session count and total usage time  
- Search query and search engine analysis  
- Detailed tabular data display  
- Export and reporting functionality  

---

## 🔧 Client Application Features

### 🎯 System Tray Integration
- Runs silently in the background  
- Right-click context menu for easy access  
- Custom tray icon with tooltip information  

### ⚙️ Configuration Management
- Server IP and port configuration  
- Auto reconnection and retry settings  
- Persistent configuration across restarts  
- Real-time connection status display  


### 📊 Status Monitoring
- Real-time system health display  
- Connection and uptime tracking  
- Logger and version monitoring  

---

## 🔌 Communication & Networking

### 🌐 Real-time Communication
- WebSocket integration for bidirectional communication  
- Automatic reconnection with retry logic  
- Secure and reliable data transmission  

### 📡 Server Features
- Express.js REST API endpoints  
- WebSocket server for real-time events  
- CORS and environment configuration support  
- Logging system for debugging and monitoring  

---

## 🚀 Deployment & Installation

### 📦 Installation Features
- Electron + NSIS installer  
- Automatic startup and shortcut creation  
- Start menu integration  

### 🔄 Update Management
- Manual and automatic update support  
- Local or remote update servers  
- Version control and installation logs  

---

## 🔒 Security & Privacy

### 🛡️ Data Security
- Encrypted communication channels  
- Secure database connections  
- Row-level access control (Supabase RLS)  
- GDPR-compliant data handling  

### 🔐 Authentication & Authorization
- Administrator privileges required for installation  
- Encrypted configuration storage  
- Windows user permission management  

---

## 📱 User Interface Features

### 🎨 Interface Design
- Modern and responsive UI design   
- Works on desktop and mobile  

### 📋 Documentation & Help
- Built-in documentation and troubleshooting  

---

## 🔧 Advanced Features

### ⚡ Performance Optimization
- Resource monitoring (CPU, memory)  
- Performance thresholds and alerts  
- Optimized background processing  

### 🔍 Debugging & Logging
- Comprehensive logs for debugging  
- Error tracking and reporting  
- Automatic log rotation and remote debugging  

### 🌐 Cloud Integration
- Supabase cloud database integration  
- Web-based monitoring dashboard  
- Netlify-ready cloud deployment  
- REST API integration for external access  

---

## 📊 Analytics & Reporting

### 📈 Data Analytics
- Application usage pattern analysis  
- System resource utilization reports  
- Session-based analytics  

### 📋 Report Generation
- Daily usage reports  
- Custom date range selection  
- Exportable charts and summary statistics  

---

**💡 Technologies Used:** Electron, Express.js, Supabase, Chart.js, MySQL, WebSocket

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
