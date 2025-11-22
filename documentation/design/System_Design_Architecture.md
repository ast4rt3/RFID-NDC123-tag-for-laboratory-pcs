# System Design Architecture: RFID NDC123 Tag for Laboratory PC

## Figure 1: System Design Architecture of RFID NDC123 Tag for Laboratory PC

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SYSTEM DESIGN ARCHITECTURE                            │
│                    RFID NDC123 Tag for Laboratory PC                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HARDWARE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│  │   CLIENT PCs    │    │   SERVER PC     │    │   DATABASE      │              │
│  │                 │    │                 │    │                 │              │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │              │
│  │ │   Windows   │ │    │ │   Windows   │ │    │ │   MySQL     │ │              │
│  │ │   OS        │ │    │ │   OS        │ │    │ │   Database  │ │              │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │              │
│  │                 │    │                 │    │                 │              │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │              │
│  │ │   Electron  │ │    │ │   Node.js   │ │    │ │   Time Logs │ │              │
│  │ │   Client    │ │    │ │   Server    │ │    │ │   Table     │ │              │
│  │ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │              │
│  │                 │    │                 │    │ ┌─────────────┐ │              │
│  │ ┌─────────────┐ │    │ ┌─────────────┐ │    │ │ App Usage   │ │              │
│  │ │   PC Logger │ │    │ │ WebSocket   │ │    │ │ Logs Table  │ │              │
│  │ │   Process   │ │    │ │   Server    │ │    │ └─────────────┘ │              │
│  │ └─────────────┘ │    │ └─────────────┘ │    │                 │              │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SOFTWARE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           CLIENT APPLICATION                               │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Main Process  │  │  Renderer       │  │   Preload       │             │ │
│  │  │   (Electron)    │  │  Process        │  │   Script        │             │ │
│  │  │                 │  │  (UI)           │  │                 │             │ │
│  │  │ • Window Mgmt   │  │ • Timer Display │  │ • API Bridge    │             │ │
│  │  │ • IPC Handling  │  │ • App Display   │  │ • Security      │             │ │
│  │  │ • Process Spawn │  │ • Status Show   │  │                 │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  │                                                                             │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │ │
│  │  │                        PC LOGGER PROCESS                               │ │ │
│  │  │                                                                         │ │ │
│  │  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │ │ │
│  │  │  │   Active Win    │  │   PID Usage     │  │   GPU Monitor   │         │ │ │
│  │  │  │   Detection     │  │   Monitor       │  │   (PowerShell)  │         │ │ │
│  │  │  │                 │  │                 │  │                 │         │ │ │
│  │  │  │ • App Name      │  │ • CPU Usage     │  │ • GPU Usage     │         │ │ │
│  │  │  │ • Process ID    │  │ • Memory Usage  │  │ • Performance   │         │ │ │
│  │  │  │ • Window Title  │  │ • Process Info  │  │ • Metrics       │         │ │ │
│  │  │  └─────────────────┘  └─────────────────┘  └─────────────────┘         │ │ │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           SERVER APPLICATION                               │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Express.js    │  │   WebSocket     │  │   MySQL2        │             │ │
│  │  │   API Server    │  │   Server        │  │   Driver        │             │ │
│  │  │                 │  │                 │  │                 │             │ │
│  │  │ • REST API      │  │ • Real-time     │  │ • Connection    │             │ │
│  │  │ • CORS Support  │  │   Communication │  │ • Query Exec    │             │ │
│  │  │ • JSON Parsing  │  │ • Session Mgmt  │  │ • Data Storage  │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Client    │───▶│  WebSocket  │───▶│   Server    │───▶│  Database   │      │
│  │   PC        │    │  Connection │    │  Processing │    │  Storage    │      │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ App Usage   │    │ Real-time   │    │ Session     │    │ Time Logs   │      │
│  │ Monitoring  │    │ Data Stream │    │ Management  │    │ Table       │      │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘      │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ System      │    │ JSON        │    │ Data        │    │ App Usage   │      │
│  │ Resources   │    │ Messages    │    │ Validation  │    │ Logs Table  │      │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              COMMUNICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           NETWORK PROTOCOLS                                │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐                    ┌─────────────────┐                │ │
│  │  │   WebSocket     │                    │   HTTP/HTTPS    │                │ │
│  │  │   (ws://)       │                    │   (http://)     │                │ │
│  │  │                 │                    │                 │                │ │
│  │  │ • Port 8080     │                    │ • Port 3000     │                │ │
│  │  │ • Real-time     │                    │ • REST API      │                │ │
│  │  │ • Bidirectional │                    │ • JSON Response │                │ │
│  │  │ • Event-driven  │                    │ • CORS Enabled  │                │ │
│  │  └─────────────────┘                    └─────────────────┘                │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           MESSAGE TYPES                                    │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Session       │  │   App Usage     │  │   System        │             │ │
│  │  │   Control       │  │   Tracking      │  │   Resources     │             │ │
│  │  │                 │  │                 │  │                 │             │ │
│  │  │ • start         │  │ • app_usage_    │  │ • CPU Usage     │             │ │
│  │  │ • stop          │  │   start         │  │ • Memory Usage  │             │ │
│  │  │ • clientConnect │  │ • app_usage_    │  │ • GPU Usage     │             │ │
│  │  │                 │  │   end           │  │ • Process Info  │             │ │
│  │  │                 │  │ • app_usage_    │  │                 │             │ │
│  │  │                 │  │   update        │  │                 │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           SECURITY MEASURES                                │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Context       │  │   IPC Security  │  │   Network       │             │ │
│  │  │   Isolation     │  │                 │  │   Security      │             │ │
│  │  │                 │  │                 │  │                 │             │ │
│  │  │ • Preload       │  │ • Secure        │  │ • Firewall      │             │ │
│  │  │   Scripts       │  │   Communication │  │   Rules         │             │ │
│  │  │ • API Bridge    │  │ • Message       │  │ • Port          │             │ │
│  │  │ • Sandboxed     │  │   Validation    │  │   Management    │             │ │
│  │  │   Environment   │  │ • Error         │  │ • IP            │             │ │
│  │  │                 │  │   Handling      │  │   Whitelisting  │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## System Architecture Description

As shown in Figure 1, the architecture organizes the main components needed to implement the RFID NDC123 Tag for Laboratory PC application and the processes that occur during operation. The system is comprised of various software components integrated for laboratory PC monitoring and usage tracking.

The architecture is divided into four main layers:

### 1. **Hardware Layer**
- **Client PCs**: Windows-based laboratory computers running the Electron client application
- **Server PC**: Central server running the Node.js application and MySQL database
- **Database**: MySQL database storing time logs and application usage data

### 2. **Software Layer**
- **Client Application**: Electron-based desktop application with main process, renderer process, and preload scripts
- **PC Logger Process**: Node.js child process monitoring active applications and system resources
- **Server Application**: Express.js API server with WebSocket server for real-time communication
- **Database Driver**: MySQL2 driver for database connectivity and query execution

### 3. **Data Flow Layer**
- **App Usage Monitoring**: Continuous monitoring of active applications and system resources
- **Real-time Communication**: WebSocket-based bidirectional communication between client and server
- **Data Processing**: Server-side data validation and session management
- **Data Storage**: Structured storage of time logs and application usage logs

### 4. **Communication Layer**
- **WebSocket Protocol**: Real-time communication on port 8080 for live data streaming
- **HTTP Protocol**: REST API on port 3000 for data retrieval and management
- **Message Types**: Structured JSON messages for session control, app usage tracking, and system resources

### 5. **Security Layer**
- **Context Isolation**: Secure communication between main and renderer processes
- **IPC Security**: Validated inter-process communication with error handling
- **Network Security**: Firewall rules and port management for secure network communication

## Operational Flow

1. **Initialization**: Client application starts and spawns PC logger process
2. **Configuration**: Client loads server configuration from external config file
3. **Connection**: Client establishes WebSocket connection to server
4. **Monitoring**: PC logger continuously monitors active applications and system resources
5. **Data Transmission**: Real-time data sent to server via WebSocket
6. **Processing**: Server validates and processes incoming data
7. **Storage**: Processed data stored in MySQL database
8. **Retrieval**: Data accessible via REST API for reporting and analysis

This architecture ensures reliable, secure, and scalable laboratory PC monitoring with real-time data collection and centralized management.