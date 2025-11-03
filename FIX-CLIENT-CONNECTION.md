# Fix Client Connection Issue

## Problem
The built RFID client application is not connecting to the server because it's using the wrong server IP address (127.0.0.1 instead of the actual server IP).

## Solution

### Quick Fix - Update Server IP

#### Option 1: Run the Update Script (Easiest)

**Windows PowerShell:**
```powershell
.\update-client-config.ps1
```

**Windows Command Prompt:**
```batch
update-client-config.bat
```

This will automatically update the config.json file in:
- Project root directory
- Installed application directory
- Alternative installation paths

#### Option 2: Manual Update

1. **Find your server's IP address** from the server console output:
   ```
   ✅ Remote connections: ws://192.168.1.11:8080
   ```
   In this example, the server IP is `192.168.1.11`

2. **Update the config file** in one of these locations:

   **For installed application:**
   ```
   C:\Users\[YourUsername]\AppData\Local\Programs\RFID NDC123 Client\config.json
   ```

   **For development:**
   ```
   [ProjectRoot]\config.json
   ```

3. **Edit config.json** to match your server IP:
   ```json
   {
     "serverIP": "192.168.1.11",
     "serverPort": 8080
   }
   ```

4. **Restart the client application**

### Verify Connection

After updating the config:

1. Start the server:
   ```bash
   node server/server.js
   ```

2. Note the server IP from the output:
   ```
   ✅ Remote connections: ws://192.168.1.11:8080
   ```

3. Start the client application

4. Check the server console for:
   ```
   💻 PC connected
   ▶ Started session for [PC_NAME]
   ```

### Troubleshooting

#### Client still not connecting?

1. **Check firewall settings:**
   - Windows Firewall might be blocking port 8080
   - Add an inbound rule for port 8080

2. **Verify server is running:**
   ```bash
   node server/server.js
   ```

3. **Check network connectivity:**
   - Ping the server IP from the client machine:
     ```
     ping 192.168.1.11
     ```

4. **Check the client logs:**
   - Look for `rfid-client-debug.log` in the application directory
   - Check for connection errors

#### Different network?

If the server IP changes (e.g., different network):
1. Run `node server/server.js` to see the new IP
2. Run `update-client-config.bat` with the new IP
3. Or manually update config.json with the new IP

### For Developers

When building the installer, the config.json in the project root will be packaged with the application. Make sure to update it before building:

```bash
# Update config.json with your server IP
# Then build the installer
npm run build
```

### Files Created

- `update-client-config.ps1` - PowerShell script to update config
- `update-client-config.bat` - Batch script to update config
- `config.json` - Updated with current server IP (192.168.1.11)
- `FIX-CLIENT-CONNECTION.md` - This guide