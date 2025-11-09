# RFID Server Tray Application Guide

The server can now run as a system tray application, hiding the terminal window and running in the background.

## Quick Start

### Run Server as Tray Application

```bash
npm run start-server-tray
```

This will:
- Start the server in the background
- Show a system tray icon
- Hide the terminal window
- Auto-start the server on launch

## Tray Icon Menu

Right-click the tray icon to access:

- **Start Server** - Start the server (if stopped)
- **Stop Server** - Stop the server (if running)
- **Restart Server** - Restart the server
- **View Status** - Open status window showing:
  - Server status (Running/Stopped)
  - HTTP and WebSocket ports
  - Number of connected PCs
  - Server uptime
- **View Logs** - Open logs window (placeholder)
- **Exit** - Stop server and exit application

## Features

### Auto-Start
The server automatically starts when you launch the tray application.

### Status Monitoring
- Real-time status updates
- Connected PC count
- Server uptime tracking

### Notifications
- Balloon notifications when server starts/stops
- Alerts if server crashes unexpectedly

### Background Operation
- Runs completely in the background
- No terminal window needed
- System tray icon only

## Installation

The tray application uses Electron (already in dependencies). No additional installation needed.

## Building

To create a standalone executable for the server tray:

1. Update `package.json` to add server tray build configuration
2. Run `npm run build` (with appropriate electron-builder config)

## Troubleshooting

### Server Won't Start
- Check that `start-server.js` or `server/server.js` exists
- Verify `server-config.env` is configured correctly
- Check Node.js is installed and in PATH

### Tray Icon Not Showing
- Check system tray area (may be hidden)
- Restart the application
- Check Windows notification area settings

### Server Crashes
- Check the status window for error messages
- Verify database configuration
- Check port availability (3000, 8080)

## Manual Start/Stop

You can still run the server manually using:
```bash
npm start
# or
npm run start-server
```

The tray application is optional but recommended for production deployments.

