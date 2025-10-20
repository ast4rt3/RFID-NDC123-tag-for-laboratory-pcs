# Client Connection Guide

## For Clients on Different PCs

### Step 1: Find Your Server IP Address

On the server PC, run this command to find the IP address:

**Windows:**
```cmd
ipconfig
```
Look for the "IPv4 Address" under your network adapter (usually starts with 192.168.x.x or 10.x.x.x)

**Alternative method:**
```cmd
hostname -I
```

### Step 2: Configure Client to Connect to Server

1. **Install the client** on the remote PC using the installer
2. **Right-click the tray icon** → **Settings**
3. **Enter the server details:**
   - **Server IP**: `192.168.1.XXX` (replace with your actual server IP)
   - **Port**: `8080`
4. **Click Save**
5. **Right-click tray icon** → **Restart Logger**

### Step 3: Verify Connection

1. **Right-click tray icon** → **View Status**
2. **Check the status window** - it should show:
   - Status: Connected
   - Server: `192.168.1.XXX:8080` (your server IP)

### Step 4: Test Data Transmission

1. **Use some applications** on the client PC
2. **Check the server logs** - you should see connection messages
3. **Check the web dashboard** - data should appear

## Troubleshooting

### Client Can't Connect

1. **Check firewall** - Windows Firewall might be blocking port 8080
2. **Check network** - Ensure both PCs are on the same network
3. **Check server** - Make sure server is running and listening on 0.0.0.0:8080

### Firewall Configuration

**On the server PC:**
```cmd
# Allow port 8080 through Windows Firewall
netsh advfirewall firewall add rule name="RFID Server WebSocket" dir=in action=allow protocol=TCP localport=8080
netsh advfirewall firewall add rule name="RFID Server HTTP" dir=in action=allow protocol=TCP localport=3000
```

### Network Testing

**Test connection from client PC:**
```cmd
# Test if server is reachable
telnet 192.168.1.XXX 8080
```

**Or use PowerShell:**
```powershell
Test-NetConnection -ComputerName 192.168.1.XXX -Port 8080
```

## Configuration Files

### Server Configuration
- File: `server-config.env`
- Set `DB_TYPE=sqlite` for local database (no XAMPP needed)
- Set `DB_TYPE=supabase` for cloud database

### Client Configuration
- File: `config.json` (in client directory)
- Contains server IP and port settings

## Example Setup

**Server PC (IP: 192.168.1.100):**
```bash
npm start
```

**Client PC 1:**
- Settings → Server IP: `192.168.1.100`, Port: `8080`

**Client PC 2:**
- Settings → Server IP: `192.168.1.100`, Port: `8080`

All clients will send data to the same server.
