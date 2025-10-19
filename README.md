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

🖥️ CORE MONITORING FEATURES
📊 Application Usage Tracking
✅ Real-time active window monitoring - Tracks currently active applications
✅ Application session tracking - Start/end times for each app usage
✅ Duration calculation - Precise timing of application usage
✅ Application name detection - Identifies specific applications being used
✅ Process ID tracking - Monitors individual processes
✅ Memory usage monitoring - Tracks RAM consumption per application
✅ CPU usage tracking - Monitors CPU percentage per application
✅ GPU usage monitoring - Tracks graphics card usage
✅ System resource optimization - Configurable monitoring intervals
🌐 Browser Activity Monitoring
✅ Multi-browser support - Chrome, Firefox, Edge, Brave, Opera
✅ Real-time browser activity tracking - Active browser window detection
✅ Search query extraction - Captures search terms from URLs
✅ Search engine identification - Google, Bing, Yahoo, DuckDuckGo, YouTube, Brave, Startpage
✅ URL monitoring - Tracks visited websites and pages
✅ Window title analysis - Extracts information from browser window titles
✅ Browser history database access - SQLite database integration
✅ Search pattern recognition - Advanced regex patterns for query extraction
⏱️ Session Management
✅ PC session tracking - Start/stop times for each PC session
✅ Session duration calculation - Total time spent on each PC
✅ Session-based resource monitoring - Resource usage per session
✅ Automatic session detection - Detects when users start/stop using PCs
🗄️ DATABASE & STORAGE FEATURES
📋 Data Storage
✅ MySQL database support - Local MySQL/MariaDB integration
✅ Supabase PostgreSQL support - Cloud database integration
✅ Multiple database providers - AWS RDS, Google Cloud SQL, PlanetScale
✅ Database migration tools - Easy switching between database providers
✅ Data backup and restore - Comprehensive backup capabilities
📊 Database Tables
✅ time_logs table - PC session start/end times and durations
✅ app_usage_logs table - Application usage with resource metrics
✅ browser_search_logs table - Browser activity and search queries
✅ Database indexes - Optimized performance with proper indexing
✅ Unique constraints - Prevents duplicate data entries
✅ Auto-incrementing IDs - Sequential primary keys
🔍 Database Views & Reporting
✅ app_daily_summary view - Daily application usage summaries
✅ pc_session_resource_avg view - Average resource usage per session
✅ pc_session_resource_summary view - Total resource usage per session
✅ Real-time data queries - Live data access and reporting
🌐 WEB DASHBOARD FEATURES
📱 Dashboard Interface
✅ Modern responsive design - Mobile-friendly interface
✅ Real-time data visualization - Live charts and graphs
✅ Interactive charts - Chart.js integration for data visualization
✅ Tabbed interface - Separate views for apps and search activity
✅ Professional UI design - Gradient backgrounds and modern styling
✅ Font Awesome icons - Professional iconography throughout
📊 Data Visualization
✅ App usage distribution charts - Bar charts showing application usage
✅ Search engine distribution charts - Pie charts showing search engine usage
✅ Summary statistics cards - Key metrics display
✅ Interactive date selection - Choose specific dates for analysis
✅ PC name selection - Filter data by specific laboratory PC
✅ Real-time data loading - Dynamic data fetching from database
📈 Reporting Features
✅ App sessions count - Number of application sessions per day
✅ Total usage time - Hours spent using applications
✅ Search query tracking - Number of search queries performed
✅ Search engine analysis - Breakdown by search engine used
✅ Detailed data tables - Comprehensive tabular data display
✅ Export capabilities - Data export functionality
🔧 CLIENT APPLICATION FEATURES
🎯 System Tray Integration
✅ Background operation - Runs silently in system tray
✅ No visible windows - Completely unobtrusive operation
✅ Right-click context menu - Easy access to all features
✅ Professional tray icon - Custom RFID monitor icon
✅ Tooltip information - Helpful hover information
⚙️ Configuration Management
✅ Server IP configuration - Easy server address setup
✅ WebSocket port settings - Configurable communication ports
✅ Reconnection settings - Automatic retry configuration
✅ Settings persistence - Configuration saved across restarts
✅ Real-time status monitoring - Live connection status display
🔄 Auto-Update System
✅ Automatic update detection - Checks for updates on startup
✅ Background download - Downloads updates silently
✅ Update notifications - Tray notifications when updates ready
✅ One-click installation - Easy update installation
✅ Version management - Automatic version tracking
✅ Rollback capability - Can revert to previous versions
📊 Status Monitoring
✅ Real-time status display - Live system health monitoring
✅ Connection status tracking - Server connectivity monitoring
✅ Uptime tracking - Application runtime monitoring
✅ Version information - Current software version display
✅ Logger status monitoring - Background process status
🔌 COMMUNICATION & NETWORKING
🌐 Real-time Communication
✅ WebSocket integration - Real-time bidirectional communication
✅ Automatic reconnection - Handles connection drops gracefully
✅ Connection retry logic - Configurable retry attempts
✅ Network error handling - Robust error management
✅ Data transmission security - Secure data transmission
📡 Server Features
✅ Express.js REST API - RESTful API endpoints
✅ WebSocket server - Real-time communication server
✅ CORS support - Cross-origin resource sharing
✅ Environment configuration - Flexible environment setup
✅ Logging system - Comprehensive logging capabilities
🚀 DEPLOYMENT & INSTALLATION
📦 Installation Features
✅ Electron installer - Professional Windows installer
✅ NSIS installer - Advanced installation options
✅ Automatic startup - Starts with Windows
✅ Desktop shortcuts - Easy access shortcuts
✅ Start menu integration - Windows Start menu integration
🔄 Update Management
✅ Manual deployment support - Flash drive installation
✅ Automatic update system - Background updates
✅ Update server support - Local or remote update servers
✅ Version control - Semantic versioning support
✅ Installation logging - Detailed installation logs
🔒 SECURITY & PRIVACY
🛡️ Data Security
✅ Secure data transmission - Encrypted communication
✅ Database security - Secure database connections
✅ Access control - Row-level security (Supabase)
✅ Privacy compliance - GDPR-compliant data handling
✅ Local data storage - Secure local configuration storage
🔐 Authentication & Authorization
✅ Administrator privileges - Requires admin access for installation
✅ User permissions - Proper Windows permission handling
✅ Secure configuration - Encrypted configuration storage
📱 USER INTERFACE FEATURES
🎨 Interface Design
✅ Modern UI design - Professional, clean interface
✅ Responsive layout - Works on all screen sizes
✅ Dark mode support - Automatic dark mode detection
✅ Mobile compatibility - Works on mobile devices
✅ Accessibility features - Screen reader compatible
📋 Documentation & Help
✅ Built-in documentation - Comprehensive help system
✅ Licensing information - MIT license details
✅ Privacy policy - Detailed privacy information
✅ Support information - Contact details and support
✅ Troubleshooting guide - Built-in troubleshooting help
🔧 ADVANCED FEATURES
⚡ Performance Optimization
✅ Resource monitoring - CPU, memory, GPU tracking
✅ Performance thresholds - Configurable performance limits
✅ Background processing - Efficient background operation
✅ Memory optimization - Optimized memory usage
✅ Process management - Intelligent process handling
🔍 Debugging & Logging
✅ Comprehensive logging - Detailed application logs
✅ Error tracking - Error logging and reporting
✅ Debug mode - Development debugging capabilities
✅ Log file management - Automatic log rotation
✅ Remote debugging - Remote troubleshooting capabilities
🌐 Cloud Integration
✅ Supabase integration - Full cloud database support
✅ Online dashboard - Web-based monitoring interface
✅ Cloud deployment - Netlify deployment ready
✅ API integration - REST API for external access
📊 ANALYTICS & REPORTING
📈 Data Analytics
✅ Usage pattern analysis - Application usage patterns
✅ Search behavior tracking - Search query analysis
✅ Resource utilization - System resource usage analysis
✅ Session analytics - PC session analysis
✅ Trend analysis - Usage trends over time
📋 Report Generation
✅ Daily reports - Daily usage summaries
✅ Custom date ranges - Flexible reporting periods
✅ Export capabilities - Data export functionality
✅ Chart generation - Automatic chart creation
✅ Summary statistics - Key performance indicators

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
