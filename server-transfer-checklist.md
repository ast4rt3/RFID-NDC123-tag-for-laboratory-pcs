# Server Transfer Checklist

Use this checklist when transferring the server to a new machine.

## Before Transfer

- [ ] Note the current server IP address
- [ ] Document current configuration (ports, database type)
- [ ] Backup any important data (if using SQLite, backup `server/local.db`)
- [ ] Note Supabase credentials (if using Supabase)

## Files to Transfer

Copy these files/folders to the new machine:

- [ ] `server/` folder (entire folder)
- [ ] `package.json`
- [ ] `start-server.js`
- [ ] `server-config.env` (or `.env`)
- [ ] `install-server.bat`
- [ ] `install-service.js` (optional)
- [ ] `SERVER_INSTALLATION_GUIDE.md` (this guide)

## On New Machine

- [ ] Install Node.js (version 16.x or higher)
- [ ] Run `install-server.bat` as Administrator
- [ ] Edit `server-config.env` with correct settings
- [ ] Update database configuration if needed
- [ ] Test server startup: `npm start`
- [ ] Verify server is accessible: http://localhost:3000/status-page

## Network Configuration

- [ ] Find new server IP address (`ipconfig`)
- [ ] Configure Windows Firewall (ports 3000 and 8080)
- [ ] Test server from another PC on the network

## Client Configuration Update

- [ ] Update all client `config.json` files with new server IP
- [ ] Test client connection to new server
- [ ] Verify data is being received

## Post-Transfer Verification

- [ ] Server starts without errors
- [ ] Status page is accessible
- [ ] Clients can connect
- [ ] Data is being logged correctly
- [ ] Database connection works (if using Supabase/SQLite)

## Optional: Windows Service

- [ ] Install as Windows Service (optional)
- [ ] Configure service to start automatically
- [ ] Test service restart

## Rollback Plan

If something goes wrong:
- [ ] Keep old server running until new one is verified
- [ ] Have backup of old server files
- [ ] Document any issues encountered


