# RFID NDC123 Server Installation Guide

This guide will help you install and set up the RFID NDC123 Server on a Windows machine.

## Prerequisites

1. **Node.js** (version 16.x or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - During installation, make sure to check "Add to PATH"

2. **Administrator Access**
   - You need administrator privileges to install the server

## Quick Installation

### Option 1: Automated Installer (Recommended)

1. **Copy the server files** to the target machine:
   - `server/` folder
   - `package.json`
   - `start-server.js`
   - `server-config.env` (or create it)
   - `install-server.bat`

2. **Run the installer**:
   - Right-click `install-server.bat`
   - Select "Run as administrator"
   - Follow the on-screen instructions

3. **Configure the server**:
   - Edit `server-config.env` with your settings
   - See [Configuration](#configuration) section below

4. **Start the server**:
   - Double-click `start-server.bat`
   - Or run: `npm start`

### Option 2: Manual Installation

1. **Install Node.js** (if not already installed)

2. **Copy server files** to the target machine

3. **Open Command Prompt** in the server directory

4. **Install dependencies**:
   ```bash
   npm install --production
   ```

5. **Create configuration file**:
   - Copy `server-config.env` and edit it
   - Or create a new `.env` file with your settings

6. **Start the server**:
   ```bash
   npm start
   ```

## Configuration

Edit `server-config.env` (or `.env`) file:

```env
# Database Configuration
# Options: 'memory', 'sqlite', or 'supabase'
DB_TYPE=memory

# Server Configuration
PORT=3000
WS_PORT=8080

# Supabase Configuration (only needed if DB_TYPE=supabase)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Database Options

1. **Memory (Default)**
   - `DB_TYPE=memory`
   - Data is stored in RAM
   - Data is lost when server restarts
   - Good for testing

2. **SQLite (Local)**
   - `DB_TYPE=sqlite`
   - Data stored in `server/local.db` file
   - Persistent storage
   - No additional setup needed

3. **Supabase (Cloud)**
   - `DB_TYPE=supabase`
   - Requires Supabase account
   - Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Data stored in cloud PostgreSQL database

## Running the Server

### Method 1: Using Batch File
- Double-click `start-server.bat`

### Method 2: Using npm
```bash
npm start
```

### Method 3: Direct Node.js
```bash
node start-server.js
```

## Installing as Windows Service (Optional)

To run the server automatically on Windows startup:

1. **Install node-windows**:
   ```bash
   npm install -g node-windows
   ```

2. **Run the service installer**:
   ```bash
   install-service.bat
   ```
   Or manually:
   ```bash
   node install-service.js
   ```

3. **Manage the service**:
   - Open Services (`services.msc`)
   - Find "RFID NDC123 Server"
   - Right-click to start/stop/restart

## Verifying Installation

Once the server is running, you should see:

```
✅ Using in-memory storage (or your DB_TYPE)
✅ WebSocket listening on ws://0.0.0.0:8080
✅ API listening on http://0.0.0.0:3000
✅ Database connection successful
✅ Status Page: http://127.0.0.1:3000/status-page
```

### Test the Server

1. **Status Page**: Open http://localhost:3000/status-page in your browser
2. **API Endpoint**: Open http://localhost:3000/logs (should return JSON or empty array)

## Firewall Configuration

If clients on other PCs can't connect, you may need to:

1. **Open Windows Firewall**:
   - Go to Windows Defender Firewall
   - Click "Advanced settings"
   - Create inbound rules for:
     - Port 3000 (TCP) - HTTP API
     - Port 8080 (TCP) - WebSocket

2. **Or allow the Node.js application**:
   - When Windows Firewall prompts, click "Allow access"

## Troubleshooting

### Port Already in Use
- Error: `EADDRINUSE: address already in use`
- **Solution**: 
  - Change `PORT` or `WS_PORT` in `server-config.env`
  - Or stop the application using the port

### Node.js Not Found
- Error: `'node' is not recognized`
- **Solution**: 
  - Install Node.js from https://nodejs.org/
  - Restart Command Prompt after installation

### Dependencies Installation Failed
- **Solution**: 
  - Run: `npm cache clean --force`
  - Then: `npm install --production`
  - Make sure you have internet connection

### Database Connection Failed
- **For Supabase**: Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- **For SQLite**: Make sure the `server/` folder has write permissions

### Clients Can't Connect
- Check server IP address (not localhost)
- Verify firewall settings
- Check that server is bound to `0.0.0.0` (not `127.0.0.1`)
- Verify WebSocket port (default: 8080)

## Server Files Structure

```
server/
├── server.js              # Main server file
├── database.js            # Database abstraction layer
├── supabase-client.js     # Supabase client (if using Supabase)
├── supabase-schema.sql    # Database schema for Supabase
└── local.db              # SQLite database (if using SQLite)

start-server.js           # Server startup script
server-config.env         # Configuration file
package.json              # Dependencies
install-server.bat        # Installer script
```

## Network Configuration

### Finding Server IP Address

1. **Open Command Prompt**
2. **Run**: `ipconfig`
3. **Look for**: IPv4 Address (usually `192.168.x.x`)

### Client Configuration

Clients need to connect to:
- **WebSocket**: `ws://SERVER_IP:8080`
- Example: `ws://192.168.1.100:8080`

Update client `config.json`:
```json
{
  "server": {
    "host": "192.168.1.100",
    "port": 8080
  }
}
```

## Uninstallation

1. **Stop the server** (if running)
2. **If installed as service**:
   - Open Services (`services.msc`)
   - Stop and delete "RFID NDC123 Server"
3. **Delete the server folder**
4. **Optional**: Uninstall Node.js if not needed

## Support

For issues or questions:
- Check the server console output for error messages
- Verify network connectivity between server and clients
- Ensure firewall rules are configured correctly

