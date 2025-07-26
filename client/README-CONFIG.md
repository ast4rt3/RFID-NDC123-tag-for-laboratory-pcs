# RFID NDC123 Client Configuration

## Server IP Configuration

After installing the RFID NDC123 Client, you need to configure the server IP address.

### Method 1: Edit config.json (Recommended)

1. Navigate to the installation directory (usually `C:\Program Files\RFID NDC123 Client\`)
2. Find the `config.json` file
3. Open it with any text editor (Notepad, VS Code, etc.)
4. Change the `serverIP` value to your server's IP address:

```json
{
  "serverIP": "192.168.1.100"
}
```

5. Save the file
6. Restart the RFID NDC123 Client application

### Method 2: First Run Configuration

When you first run the application, it will show a configuration dialog. Choose "Configure" and follow the instructions.

### Example IP Addresses

- **Local server**: `localhost` or `127.0.0.1`
- **Network server**: `192.168.1.100` (replace with your actual server IP)
- **Domain name**: `server.example.com` (if you have a domain)

### Troubleshooting

- If the client cannot connect, check that:
  1. The server IP address is correct
  2. The server is running and accessible
  3. Firewall settings allow the connection
  4. Ports 3000 (API) and 8080 (WebSocket) are open on the server

### Default Configuration

The default configuration uses `localhost` which works if the server is running on the same computer as the client. 