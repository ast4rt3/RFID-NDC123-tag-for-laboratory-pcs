# 🔧 Troubleshooting Guide
## RFID Monitoring System - Common Issues & Solutions

### 📋 Quick Reference

| Issue | Quick Fix | Full Solution |
|-------|-----------|---------------|
| Clients not connecting | Restart server | [Network Issues](#network-issues) |
| No data collection | Check client logs | [Data Collection Issues](#data-collection-issues) |
| Dashboard not loading | Check server status | [Server Issues](#server-issues) |
| Database errors | Verify credentials | [Database Issues](#database-issues) |

---

## 🚨 Emergency Procedures

### Server Down
```powershell
# Quick restart
pm2 restart rfid-server

# Check status
pm2 status

# View logs
pm2 logs rfid-server
```

### All Clients Disconnected
```powershell
# Restart server
pm2 restart rfid-server

# Check network connectivity
Test-NetConnection -ComputerName [SERVER_IP] -Port 8080
```

---

## 🌐 Network Issues

### Problem: Clients Cannot Connect to Server

**Symptoms:**
- PCs don't appear in dashboard
- "Connection failed" errors in client logs
- WebSocket connection errors

**Diagnosis:**
```powershell
# Test server connectivity
ping [SERVER_IP]
telnet [SERVER_IP] 8080
telnet [SERVER_IP] 3000

# Check server status
pm2 status
netstat -an | findstr :8080
```

**Solutions:**

1. **Check Server Status**
   ```powershell
   pm2 status
   pm2 restart rfid-server
   ```

2. **Verify Firewall Rules**
   ```powershell
   netsh advfirewall firewall show rule name="RFID Server WebSocket"
   netsh advfirewall firewall show rule name="RFID Server HTTP"
   ```

3. **Check Network Configuration**
   ```powershell
   # Verify server IP
   ipconfig
   
   # Test connectivity from client PC
   Test-NetConnection -ComputerName [SERVER_IP] -Port 8080
   ```

4. **Restart Network Services**
   ```powershell
   # On server
   Restart-Service -Name "WinRM"
   
   # On client
   Restart-Service -Name "WinRM"
   ```

### Problem: Intermittent Connection Loss

**Symptoms:**
- Clients connect and disconnect randomly
- Dashboard shows PCs going online/offline
- Data collection gaps

**Solutions:**

1. **Increase Reconnection Attempts**
   ```json
   // In client-config.json
   {
     "server": {
       "reconnectInterval": 3000,
       "maxReconnectAttempts": 20
     }
   }
   ```

2. **Check Network Stability**
   ```powershell
   # Continuous ping test
   ping -t [SERVER_IP]
   ```

3. **Optimize Network Settings**
   ```powershell
   # Increase TCP keep-alive
   netsh int tcp set global autotuninglevel=normal
   ```

---

## 💻 Client Issues

### Problem: Client Application Not Starting

**Symptoms:**
- No RFID process running
- Client application crashes on startup
- "Module not found" errors

**Diagnosis:**
```powershell
# Check if client is running
Get-Process | Where-Object {$_.ProcessName -like "*RFID*"}

# Check client logs
Get-Content C:\RFID-Client\logs\client.log -Tail 20

# Check deployment logs
Get-Content C:\RFID-Client\deployment.log -Tail 20
```

**Solutions:**

1. **Reinstall Client**
   ```powershell
   # Stop existing processes
   Get-Process | Where-Object {$_.ProcessName -like "*RFID*"} | Stop-Process -Force
   
   # Reinstall
   cd C:\RFID-Client
   npm install --production
   npm run build
   
   # Restart
   Start-Process "C:\RFID-Client\dist\RFID NDC123 Client.exe"
   ```

2. **Fix Missing Dependencies**
   ```powershell
   # Install missing modules
   npm install sqlite3 --save
   npm install active-win --save
   npm install pidusage --save
   ```

3. **Check Node.js Version**
   ```powershell
   node --version
   npm --version
   
   # Update if needed
   npm install -g npm@latest
   ```

### Problem: Client Collecting No Data

**Symptoms:**
- Client running but no data in dashboard
- Empty logs
- No browser activity detected

**Diagnosis:**
```powershell
# Check client configuration
Get-Content C:\RFID-Client\config.json

# Check monitoring settings
Get-Content C:\RFID-Client\client-config.json

# Test active window detection
# (Run client in debug mode)
```

**Solutions:**

1. **Verify Configuration**
   ```json
   // Ensure monitoring is enabled
   {
     "monitoring": {
       "enableBrowserTracking": true,
       "enableProcessTracking": true,
       "activeWindowInterval": 1000
     }
   }
   ```

2. **Check Permissions**
   ```powershell
   # Run as administrator
   # Check Windows permissions for:
   # - Active window monitoring
   # - Process monitoring
   # - Browser history access
   ```

3. **Test Data Collection**
   ```powershell
   # Enable debug logging
   # Check if active-win is working
   # Verify browser detection
   ```

---

## 🖥️ Server Issues

### Problem: Server Not Starting

**Symptoms:**
- PM2 shows server as stopped
- Port 3000/8080 not listening
- Server crashes on startup

**Diagnosis:**
```powershell
# Check PM2 status
pm2 status
pm2 logs rfid-server

# Check port usage
netstat -an | findstr :3000
netstat -an | findstr :8080

# Check Node.js version
node --version
```

**Solutions:**

1. **Check Dependencies**
   ```powershell
   # Reinstall dependencies
   npm install
   
   # Check for missing modules
   npm list
   ```

2. **Fix Port Conflicts**
   ```powershell
   # Find process using port
   netstat -ano | findstr :3000
   
   # Kill conflicting process
   taskkill /PID [PID_NUMBER] /F
   ```

3. **Check Environment Variables**
   ```powershell
   # Verify .env file
   Get-Content .env
   
   # Test Supabase connection
   curl -H "apikey: YOUR_KEY" https://your-project.supabase.co/rest/v1/
   ```

### Problem: Server Performance Issues

**Symptoms:**
- Slow response times
- High CPU/memory usage
- Dashboard loading slowly

**Diagnosis:**
```powershell
# Check server performance
pm2 monit

# Check system resources
Get-WmiObject -Class Win32_LogicalDisk
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
```

**Solutions:**

1. **Optimize Server Configuration**
   ```javascript
   // In server.js
   const server = require('http').createServer(app);
   server.listen(3000, '0.0.0.0', () => {
     console.log('Server optimized for performance');
   });
   ```

2. **Database Optimization**
   ```sql
   -- Check database performance
   -- Optimize queries
   -- Add indexes if needed
   ```

3. **Resource Management**
   ```powershell
   # Restart server periodically
   pm2 restart rfid-server
   
   # Clear old logs
   pm2 flush
   ```

---

## 🗄️ Database Issues

### Problem: Supabase Connection Failed

**Symptoms:**
- "Database connection failed" errors
- No data being stored
- Authentication errors

**Diagnosis:**
```powershell
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/

# Check environment variables
Get-Content .env
```

**Solutions:**

1. **Verify Credentials**
   ```env
   # Check .env file
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. **Check Supabase Status**
   ```powershell
   # Test API endpoint
   Invoke-RestMethod -Uri "https://your-project.supabase.co/rest/v1/" -Headers @{"apikey"="YOUR_KEY"}
   ```

3. **Reset Connection**
   ```powershell
   # Restart server
   pm2 restart rfid-server
   
   # Clear connection cache
   # (If applicable)
   ```

### Problem: Data Not Storing

**Symptoms:**
- Data appears in logs but not in database
- Dashboard shows no data
- Insert errors in server logs

**Solutions:**

1. **Check Database Schema**
   ```sql
   -- Verify tables exist
   SELECT * FROM information_schema.tables WHERE table_name IN ('time_logs', 'app_usage_logs', 'browser_search_logs');
   ```

2. **Test Data Insertion**
   ```javascript
   // Test insert operation
   const testData = {
     pc_name: 'TEST-PC',
     start_time: new Date(),
     end_time: new Date(),
     duration_seconds: 60
   };
   
   // Try inserting test data
   ```

3. **Check RLS Policies**
   ```sql
   -- Verify Row Level Security policies
   SELECT * FROM pg_policies WHERE tablename IN ('time_logs', 'app_usage_logs', 'browser_search_logs');
   ```

---

## 📊 Dashboard Issues

### Problem: Dashboard Not Loading

**Symptoms:**
- Blank page in browser
- JavaScript errors
- CSS not loading

**Diagnosis:**
```powershell
# Check server status
pm2 status

# Test HTTP endpoint
curl http://localhost:3000

# Check browser console for errors
```

**Solutions:**

1. **Check Server Status**
   ```powershell
   pm2 restart rfid-server
   pm2 logs rfid-server
   ```

2. **Clear Browser Cache**
   ```javascript
   // Clear browser cache
   // Hard refresh (Ctrl+F5)
   // Check browser console
   ```

3. **Verify Static Files**
   ```powershell
   # Check if static files are served
   curl http://localhost:3000/static/css/style.css
   curl http://localhost:3000/static/js/app.js
   ```

### Problem: No Data in Dashboard

**Symptoms:**
- Dashboard loads but shows no data
- "No data available" messages
- Charts not rendering

**Solutions:**

1. **Check Data Endpoints**
   ```powershell
   # Test API endpoints
   curl http://localhost:3000/api/logs
   curl http://localhost:3000/api/pcs
   ```

2. **Verify Database Connection**
   ```powershell
   # Check server logs for database errors
   pm2 logs rfid-server | findstr "database"
   ```

3. **Test Data Flow**
   ```powershell
   # Check if clients are sending data
   # Verify WebSocket connections
   # Check server logs for incoming data
   ```

---

## 🔍 Advanced Troubleshooting

### Log Analysis

**Server Logs:**
```powershell
# View recent server logs
pm2 logs rfid-server --lines 100

# Monitor logs in real-time
pm2 logs rfid-server --follow

# Check for specific errors
pm2 logs rfid-server | findstr "ERROR"
```

**Client Logs:**
```powershell
# Check client logs on each PC
Get-Content C:\RFID-Client\logs\client.log -Tail 50

# Check deployment logs
Get-Content C:\RFID-Client\deployment.log -Tail 50
```

### Performance Monitoring

**System Resources:**
```powershell
# Monitor CPU usage
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Monitor memory usage
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10

# Check disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}
```

**Network Monitoring:**
```powershell
# Monitor network connections
netstat -an | findstr :8080
netstat -an | findstr :3000

# Check network usage
Get-NetAdapterStatistics | Select-Object Name, BytesReceived, BytesSent
```

### Database Debugging

**Supabase Debugging:**
```javascript
// Test database connection
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Test query
supabase.from('time_logs').select('*').limit(1).then(console.log);
```

**Query Performance:**
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 🆘 Emergency Recovery

### Complete System Restart

```powershell
# 1. Stop all services
pm2 stop all
pm2 delete all

# 2. Restart server
pm2 start server/server.js --name "rfid-server"

# 3. Restart all clients
.\deploy-clients.ps1 -Force

# 4. Verify system status
pm2 status
```

### Data Recovery

```powershell
# 1. Check database backup
# 2. Restore from backup if needed
# 3. Verify data integrity
# 4. Restart data collection
```

### Network Reset

```powershell
# 1. Reset network configuration
netsh int ip reset
netsh winsock reset

# 2. Restart network services
Restart-Service -Name "WinRM"
Restart-Service -Name "DNS"

# 3. Reconfigure static IP
# 4. Test connectivity
```

---

## 📞 Support Escalation

### Level 1: Basic Troubleshooting
- Check logs
- Restart services
- Verify configuration

### Level 2: Advanced Troubleshooting
- Network analysis
- Performance optimization
- Database debugging

### Level 3: Expert Support
- System architecture review
- Custom solutions
- Emergency recovery

### Contact Information
- **System Administrator**: [Your Contact]
- **IT Support**: [IT Contact]
- **Project Lead**: [Lead Contact]

---

## 📚 Additional Resources

### Documentation
- `MULTI_PC_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `LABORATORY_SETUP_GUIDE.md` - Laboratory setup instructions
- `API_DOCS.md` - API documentation

### Tools
- `deploy-clients.ps1` - Client deployment script
- `update-clients.ps1` - Client update script
- `setup-server.ps1` - Server setup script

### Log Files
- Server logs: `logs/server.log`
- Client logs: `C:\RFID-Client\logs\client.log`
- Deployment logs: `C:\RFID-Client\deployment.log`

---

**🔧 This troubleshooting guide should help you resolve most common issues. For complex problems, contact your system administrator.**
