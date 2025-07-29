# Use-Case Diagram: RFID NDC123 Tag for Laboratory PC

## Figure 2: Use-Case Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USE-CASE DIAGRAM                                   │
│                    RFID NDC123 Tag for Laboratory PC                           │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ACTORS                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐              │
│  │   Laboratory    │    │   System        │    │   Database      │              │
│  │   User          │    │   Administrator │    │   System        │              │
│  │                 │    │                 │    │                 │              │
│  │ • Student       │    │ • IT Staff      │    │ • MySQL         │              │
│  │ • Researcher    │    │ • Lab Manager   │    │ • Data Storage  │              │
│  │ • Instructor    │    │ • Network Admin │    │ • Backup System │              │
│  │ • Lab Assistant │    │                 │    │                 │              │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USE CASES                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           CLIENT-SIDE USE CASES                            │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Start         │  │   Monitor       │  │   Display       │             │ │
│  │  │   Application   │  │   PC Usage      │  │   Timer         │             │ │
│  │  │                 │  │                 │  │                 │             │ │
│  │  │ • Launch Client │  │ • Track Active  │  │ • Show Runtime  │             │ │
│  │  │ • Load Config   │  │   Applications  │  │ • Display       │             │ │
│  │  │ • Connect to    │  │ • Monitor CPU   │  │   Current App   │             │ │
│  │  │   Server        │  │ • Monitor       │  │ • Show Status   │             │ │
│  │  │                 │  │   Memory        │  │                 │             │ │
│  │  │                 │  │ • Monitor GPU   │  │                 │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Send Data     │  │   Handle        │  │   Stop          │             │ │
│  │  │   to Server     │  │   Connection    │  │   Application   │             │ │
│  │  │                 │  │   Errors        │  │                 │             │ │
│  │  │ • Transmit      │  │ • Reconnect     │  │ • Close Client  │             │ │
│  │  │   Usage Data    │  │ • Handle        │  │ • Stop Logger   │             │ │
│  │  │ • Send Session  │  │   Network       │  │ • Save Final    │             │ │
│  │  │   Info          │  │   Issues        │  │   Data          │             │ │
│  │  │ • Send System   │  │ • Log Errors    │  │                 │             │ │
│  │  │   Resources     │  │                 │  │                 │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           SERVER-SIDE USE CASES                            │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Manage        │  │   Process       │  │   Store Data    │             │ │
│  │  │   Connections   │  │   Incoming      │  │                 │             │ │
│  │  │                 │  │   Data          │  │                 │             │ │
│  │  │ • Accept Client │  │ • Validate      │  │ • Save Time     │             │ │
│  │  │   Connections   │  │   Data Format   │  │   Logs          │             │ │
│  │  │ • Track Active  │  │ • Parse JSON    │  │ • Save App      │             │ │
│  │  │   Sessions      │  │   Messages      │  │   Usage Logs    │             │ │
│  │  │ • Handle        │  │ • Extract       │  │ • Update        │             │ │
│  │  │   Disconnections│  │   Metrics       │  │   Existing      │             │ │
│  │  │                 │  │                 │  │   Records       │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Provide       │  │   Generate      │  │   Manage        │             │ │
│  │  │   API Access    │  │   Reports       │  │   Database      │             │ │
│  │  │                 │  │                 │  │                 │             │ │
│  │  │ • Serve REST    │  │ • Create Usage  │  │ • Maintain      │             │ │
│  │  │   API           │  │   Reports       │  │   Database      │             │ │
│  │  │ • Handle CORS   │  │ • Generate      │  │   Connections   │             │ │
│  │  │ • Return JSON   │  │   Statistics    │  │ • Optimize      │             │ │
│  │  │   Data          │  │ • Export Data   │  │   Queries       │             │ │
│  │  │                 │  │                 │  │ • Backup Data   │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           ADMINISTRATIVE USE CASES                         │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Configure     │  │   Monitor       │  │   Generate      │             │ │
│  │  │   System        │  │   System        │  │   Analytics     │             │ │
│  │  │                 │  │   Health        │  │                 │             │ │
│  │  │ • Set Server    │  │ • Check Server  │  │ • Analyze Usage │             │ │
│  │  │   IP            │  │   Status        │  │   Patterns      │             │ │
│  │  │ • Configure     │  │ • Monitor       │  │ • Identify      │             │ │
│  │  │   Ports         │  │   Database      │  │   Trends        │             │ │
│  │  │ • Set Firewall  │  │   Performance   │  │ • Create        │             │ │
│  │  │   Rules         │  │ • Check Network │  │   Reports       │             │ │
│  │  │                 │  │   Connectivity  │  │                 │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  │                                                                             │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │ │
│  │  │   Manage        │  │   Troubleshoot  │  │   Backup &      │             │ │
│  │  │   Users         │  │   Issues        │  │   Restore       │             │ │
│  │  │                 │  │                 │  │                 │             │ │
│  │  │ • Add/Remove    │  │ • Diagnose      │  │ • Backup        │             │ │
│  │  │   Clients       │  │   Connection    │  │   Database      │             │ │
│  │  │ • Assign        │  │   Problems      │  │ • Restore       │             │ │
│  │  │   Permissions   │  │ • Fix Config    │  │   Data          │             │ │
│  │  │ • Monitor       │  │   Issues        │  │ • Archive       │             │ │
│  │  │   Access        │  │ • Resolve       │  │   Old Data      │             │ │
│  │  │                 │  │   Errors        │  │                 │             │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RELATIONSHIPS                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           ACTOR RELATIONSHIPS                               │ │
│  │                                                                             │ │
│  │  Laboratory User ──────▶ Start Application                                  │ │
│  │  Laboratory User ──────▶ Monitor PC Usage                                   │ │
│  │  Laboratory User ──────▶ Display Timer                                      │ │
│  │  Laboratory User ──────▶ Stop Application                                   │ │
│  │                                                                             │ │
│  │  System Administrator ──▶ Configure System                                  │ │
│  │  System Administrator ──▶ Monitor System Health                             │ │
│  │  System Administrator ──▶ Manage Users                                      │ │
│  │  System Administrator ──▶ Troubleshoot Issues                               │ │
│  │  System Administrator ──▶ Generate Analytics                                │ │
│  │  System Administrator ──▶ Backup & Restore                                  │ │
│  │                                                                             │ │
│  │  Database System ──────▶ Store Data                                         │ │
│  │  Database System ──────▶ Maintain Connections                               │ │
│  │  Database System ──────▶ Optimize Performance                               │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           INCLUDE RELATIONSHIPS                             │ │
│  │                                                                             │ │
│  │  Start Application ──────▶ Load Config                                      │ │
│  │  Start Application ──────▶ Connect to Server                                │ │
│  │  Monitor PC Usage ──────▶ Send Data to Server                               │ │
│  │  Process Incoming Data ──▶ Store Data                                       │ │
│  │  Generate Analytics ────▶ Provide API Access                                │ │
│  │  Troubleshoot Issues ───▶ Monitor System Health                             │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                           EXTEND RELATIONSHIPS                              │ │
│  │                                                                             │ │
│  │  Handle Connection Errors ◀─── Send Data to Server                          │ │
│  │  Reconnect ◀─── Handle Connection Errors                                    │ │
│  │  Log Errors ◀─── Handle Connection Errors                                   │ │
│  │  Fix Config Issues ◀─── Troubleshoot Issues                                 │ │
│  │  Resolve Errors ◀─── Troubleshoot Issues                                    │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Use-Case Description

The Use-Case Diagram describes the interactions between different actors and the system components of the RFID NDC123 Tag for Laboratory PC application. The diagram shows how laboratory users, system administrators, and the database system interact with various use cases to achieve the system's objectives.

### **Primary Actors:**

1. **Laboratory User**: Students, researchers, instructors, and lab assistants who use the laboratory PCs
2. **System Administrator**: IT staff, lab managers, and network administrators who manage the system
3. **Database System**: MySQL database that stores and manages all system data

### **Main Use Cases:**

#### **Client-Side Use Cases:**
- **Start Application**: Launch the client application and establish connection
- **Monitor PC Usage**: Track active applications and system resources
- **Display Timer**: Show runtime and current application information
- **Send Data to Server**: Transmit usage data and session information
- **Handle Connection Errors**: Manage network issues and reconnection
- **Stop Application**: Properly close the application and save final data

#### **Server-Side Use Cases:**
- **Manage Connections**: Handle client connections and session tracking
- **Process Incoming Data**: Validate and process received data
- **Store Data**: Save time logs and application usage data
- **Provide API Access**: Serve REST API for data retrieval
- **Generate Reports**: Create usage reports and statistics
- **Manage Database**: Maintain database connections and performance

#### **Administrative Use Cases:**
- **Configure System**: Set up server IP, ports, and firewall rules
- **Monitor System Health**: Check server status and performance
- **Manage Users**: Add/remove clients and assign permissions
- **Troubleshoot Issues**: Diagnose and resolve system problems
- **Generate Analytics**: Analyze usage patterns and create reports
- **Backup & Restore**: Maintain data integrity and recovery

### **Key Relationships:**

- **Include Relationships**: Show dependencies between use cases
- **Extend Relationships**: Show optional or conditional behaviors
- **Actor Relationships**: Show which actors interact with which use cases

This use-case diagram provides a comprehensive view of how the system functions from the perspective of different users and stakeholders, ensuring all requirements are captured and the system design addresses all necessary interactions.