const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const Database = require('./database');
const StatusIndicator = require('./status-indicator');

// Load environment variables
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize database (supports both SQLite and Supabase)
const db = new Database();

// Test database connection (non-blocking)
db.testConnection().then(connected => {
  if (connected) {
    console.log('✅ Database connection successful');
  } else {
    console.warn('⚠️ Database connection failed, but server will continue running');
  }
});

// Initialize status indicator
let statusIndicator;

// Store active sessions in memory
const activeSessions = {}; // { clientId: { pc_name, start_time } }
const appActiveSessions = {}; // { clientId: { app_name, start_time } }

// WebSocket server - bind to all interfaces for remote connections
const wss = new WebSocket.Server({ port: wsPort, host: '0.0.0.0' });
console.log(`✅ WebSocket listening on ws://0.0.0.0:${wsPort}`);
console.log(`✅ Local connections: ws://127.0.0.1:${wsPort}`);
console.log(`✅ Remote connections: ws://192.168.141.106:${wsPort}`);

// Server status indicator
let serverStatus = {
  isActive: true,
  startTime: new Date(),
  connectedClients: 0,
  totalSessions: 0,
  lastActivity: null
};

// Status endpoint
app.get('/status', (req, res) => {
  const uptime = Math.floor((Date.now() - serverStatus.startTime.getTime()) / 1000);
  res.json({
    ...serverStatus,
    uptime: uptime,
    uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
    memoryUsage: process.memoryUsage(),
    connections: wss.clients.size,
    activePCs: Object.keys(activeSessions),
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform
  });
});

// Status page endpoint
app.get('/status-page', (req, res) => {
  const statusPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RFID Server Status</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .status-card:hover {
            transform: translateY(-5px);
        }
        .status-indicator {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
            animation: pulse 2s infinite;
        }
        .status-running { background-color: #4CAF50; }
        .status-stopped { background-color: #f44336; }
        .status-warning { background-color: #ff9800; }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .metric-label { font-weight: 600; color: #666; }
        .metric-value { font-weight: 700; color: #333; }
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px auto;
            display: block;
            transition: background 0.3s ease;
        }
        .refresh-btn:hover { background: #5a6fd8; }
        .pc-list {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 10px;
        }
        .pc-item {
            padding: 8px 12px;
            margin: 5px 0;
            background: white;
            border-radius: 6px;
            border-left: 4px solid #4CAF50;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖥️ RFID Server Status</h1>
            <p>Real-time monitoring dashboard</p>
        </div>

        <div class="status-grid">
            <div class="status-card">
                <div class="status-indicator">
                    <div class="status-dot status-running" id="server-status"></div>
                    <h3>Server Status</h3>
                </div>
                <div class="metric">
                    <span class="metric-label">Status:</span>
                    <span class="metric-value" id="server-state">Running</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime:</span>
                    <span class="metric-value" id="uptime">0s</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Node Version:</span>
                    <span class="metric-value">${process.version}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Platform:</span>
                    <span class="metric-value">${process.platform}</span>
                </div>
            </div>

            <div class="status-card">
                <div class="status-indicator">
                    <div class="status-dot status-running" id="connection-status"></div>
                    <h3>Connections</h3>
                </div>
                <div class="metric">
                    <span class="metric-label">Active PCs:</span>
                    <span class="metric-value" id="active-pcs">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Sessions:</span>
                    <span class="metric-value" id="total-sessions">0</span>
                </div>
                <div class="metric">
                    <span class="metric-label">WebSocket:</span>
                    <span class="metric-value">ws://0.0.0.0:8080</span>
                </div>
                <div class="metric">
                    <span class="metric-label">HTTP API:</span>
                    <span class="metric-value">http://0.0.0.0:3000</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Last Activity:</span>
                    <span class="metric-value" id="last-activity">Never</span>
                </div>
            </div>

            <div class="status-card">
                <div class="status-indicator">
                    <div class="status-dot status-running"></div>
                    <h3>Active PCs</h3>
                </div>
                <div id="pc-list" class="pc-list">
                    <div class="pc-item">
                        <span>No active PCs</span>
                        <span class="metric-value">Offline</span>
                    </div>
                </div>
            </div>
        </div>

        <button class="refresh-btn" onclick="refreshStatus()">🔄 Refresh Status</button>
    </div>

    <script>
        function formatUptime(seconds) {
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (days > 0) return days + 'd ' + hours + 'h ' + minutes + 'm';
            if (hours > 0) return hours + 'h ' + minutes + 'm ' + secs + 's';
            if (minutes > 0) return minutes + 'm ' + secs + 's';
            return secs + 's';
        }

        function updateStatus() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('server-state').textContent = data.isActive ? 'Running' : 'Stopped';
                    document.getElementById('uptime').textContent = formatUptime(data.uptime);
                    document.getElementById('active-pcs').textContent = data.connectedClients;
                    document.getElementById('total-sessions').textContent = data.totalSessions;
                    document.getElementById('last-activity').textContent = 
                        data.lastActivity ? new Date(data.lastActivity).toLocaleString() : 'Never';
                    
                    // Update PC list
                    const pcList = document.getElementById('pc-list');
                    if (data.connectedClients > 0) {
                        pcList.innerHTML = '<div class="pc-item"><span>Connected PCs</span><span class="metric-value">' + data.connectedClients + ' Online</span></div>';
                    } else {
                        pcList.innerHTML = '<div class="pc-item"><span>No active PCs</span><span class="metric-value">Offline</span></div>';
                    }
                    
                    // Update status indicators
                    const serverStatus = document.getElementById('server-status');
                    const connectionStatus = document.getElementById('connection-status');
                    
                    serverStatus.className = 'status-dot ' + (data.isActive ? 'status-running' : 'status-stopped');
                    connectionStatus.className = 'status-dot ' + (data.connectedClients > 0 ? 'status-running' : 'status-warning');
                })
                .catch(error => {
                    console.error('Error fetching status:', error);
                });
        }

        function refreshStatus() {
            updateStatus();
        }

        // Auto-refresh every 5 seconds
        setInterval(updateStatus, 5000);
        
        // Initial load
        updateStatus();
    </script>
</body>
</html>`;
  
  res.send(statusPage);
});

// Debug endpoint for real-time monitoring
app.get('/debug', (req, res) => {
  res.json({
    server: serverStatus,
    activeSessions: Object.keys(activeSessions).length,
    appActiveSessions: Object.keys(appActiveSessions).length,
    database: {
      type: db.type,
      connected: true
    }
  });
});

// On connection
wss.on('connection', ws => {
  console.log('💻 PC connected');
  serverStatus.connectedClients++;
  serverStatus.lastActivity = new Date();
  let clientId = null;

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    if (data.type === 'start') {
      // PC starts
      clientId = data.pc_name;
      const startTime = new Date();
      activeSessions[clientId] = { start_time: startTime };
      appActiveSessions[clientId] = {}; // Initialize app session tracking
      serverStatus.totalSessions++;
      serverStatus.lastActivity = new Date();
      console.log(`▶ Started session for ${clientId} at ${startTime}`);
    } else if (data.type === 'stop') {
      // PC stops
      if (activeSessions[data.pc_name]) {
        const endTime = new Date();
        const startTime = activeSessions[data.pc_name].start_time;
        const duration = Math.floor((endTime - startTime) / 1000);

        // Save to database
        db.insertTimeLog(data.pc_name, startTime, endTime, duration);

        delete activeSessions[data.pc_name];
        delete appActiveSessions[data.pc_name];
      }
    } else if (
      data.type === 'app_usage_start'
    ) {
      // Start tracking a new app session for this client
      if (!appActiveSessions[clientId]) appActiveSessions[clientId] = {};
      appActiveSessions[clientId][data.app_name] = { start_time: new Date() };
    } else if (
      data.type === 'app_usage_end'
    ) {
      // End the app session and log to DB
      if (appActiveSessions[clientId] && appActiveSessions[clientId][data.app_name]) {
        const startTime = appActiveSessions[clientId][data.app_name].start_time;
        const endTime = new Date();
        const duration = Math.floor((endTime - startTime) / 1000);
        db.insertAppUsageLog(
          data.pc_name,
          data.app_name,
          startTime,
          endTime,
          duration,
          data.memory_usage_bytes,
          data.cpu_percent,
          data.cpu_temperature,
          data.is_cpu_overclocked,
          data.is_ram_overclocked
        );
        delete appActiveSessions[clientId][data.app_name];
      }
    } else if (
      data.type === 'app_usage_update'
    ) {
      // Update the end_time and duration for the current app session
      if (appActiveSessions[clientId] && appActiveSessions[clientId][data.app_name]) {
        const startTime = appActiveSessions[clientId][data.app_name].start_time;
        const endTime = new Date();
        const duration = Math.floor((endTime - startTime) / 1000);
        db.insertAppUsageLog(
          data.pc_name,
          data.app_name,
          startTime,
          endTime,
          duration,
          data.memory_usage_bytes,
          data.cpu_percent,
          data.gpu_percent
        );
      }
    }
    
    // Handle browser activity messages
    else if (data.type === 'browser_activity') {
      console.log('🔍 Browser activity logged:', data);
      
      // Detect incognito/private browsing
      let browserInfo = data.browser || 'Unknown';
      let isIncognito = false;
      
      if (data.url) {
        // Check for incognito indicators in URL
        isIncognito = data.url.includes('incognito') || 
                     data.url.includes('private') || 
                     data.url.includes('inprivate');
        
        if (isIncognito) {
          browserInfo += ' (Incognito)';
        }
      }
      
      db.insertBrowserSearchLog(
        data.pc_name,
        browserInfo,
        data.url,
        data.search_query,
        data.search_engine,
        data.timestamp
      );
    }
    
    // Handle temperature monitoring messages
    else if (data.type === 'temperature_log') {
      console.log('🌡️ Temperature data logged:', data);
      db.insertTemperatureLog(
        data.pc_name,
        data.cpu_temperature,
        data.gpu_temperature,
        data.motherboard_temperature,
        data.ambient_temperature,
        data.is_critical
      );
    }
    
    // Handle overclocking alert messages
    else if (data.type === 'overclocking_alert') {
      console.log('⚠️ Overclocking alert:', data);
      db.insertOverclockingAlert(
        data.pc_name,
        data.alert_type,
        data.component_name,
        data.original_frequency,
        data.current_frequency,
        data.overclock_percentage,
        data.temperature_impact
      );
    }
    
    // Handle system metrics messages
    else if (data.type === 'system_metrics') {
      console.log('📊 System metrics logged:', data);
      db.insertSystemMetrics(
        data.pc_name,
        data.cpu_usage_percent,
        data.memory_usage_percent,
        data.cpu_temperature,
        data.gpu_temperature,
        data.cpu_frequency,
        data.memory_frequency,
        data.is_cpu_overclocked,
        data.is_ram_overclocked,
        data.is_gpu_overclocked,
        data.power_consumption_watts || 0,
        data.fan_speed_rpm || 0
      );
    }
    
    // Handle browser history messages
    else if (data.type === 'browser_history') {
      console.log('📚 Browser history logged:', data.entries?.length || 0, 'entries');
      if (data.entries && data.entries.length > 0) {
        data.entries.forEach(entry => {
          db.insertBrowserSearchLog(
            data.pc_name,
            entry.browser,
            entry.url,
            entry.searchQuery,
            entry.searchEngine,
            entry.timestamp
          );
        });
        console.log('✅ Browser history saved to database');
      }
    }
    
    // Handle browser extension search messages
    else if (data.type === 'browser_extension_search') {
      console.log('🔌 Extension search logged:', data);
      db.insertBrowserSearchLog(
        data.pc_name,
        data.browser,
        data.url,
        data.search_query,
        data.search_engine,
        data.timestamp
      );
    }
  });

  ws.on('close', () => {
    console.log('💻 PC disconnected');
    serverStatus.connectedClients = Math.max(0, serverStatus.connectedClients - 1);
    serverStatus.lastActivity = new Date();
    
    if (clientId && activeSessions[clientId]) {
      const endTime = new Date();
      const startTime = activeSessions[clientId].start_time;
      const duration = Math.floor((endTime - startTime) / 1000);

      db.insertTimeLog(clientId, startTime, endTime, duration);

      delete activeSessions[clientId];
      delete appActiveSessions[clientId];
    }
  });
});



// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// API to get logs
app.get('/logs', async (req, res) => {
  try {
    const logs = await db.getTimeLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Browser logs API endpoint
app.get('/browser-logs', async (req, res) => {
  const { pc_name, search_engine, limit = 100 } = req.query;
  
  try {
    const logs = await db.getBrowserLogs(pc_name, search_engine, limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching browser logs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const dashboardPath = path.join(__dirname, '../web-dashboard.html');
  
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Dashboard not found');
  }
});

// System metrics API endpoint
app.get('/api/system-metrics', async (req, res) => {
  const { pc_name, limit = 100 } = req.query;
  
  try {
    const metrics = await db.getSystemMetrics(pc_name, limit);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Overclocking alerts API endpoint
app.get('/api/overclocking-alerts', async (req, res) => {
  const { pc_name, limit = 50 } = req.query;
  
  try {
    const alerts = await db.getOverclockingAlerts(pc_name, limit);
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching overclocking alerts:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// PC status API endpoint
app.get('/api/pc-status', async (req, res) => {
  try {
    const statuses = await db.getPCStatus();
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching PC status:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Temperature logs API endpoint
app.get('/api/temperature-logs', async (req, res) => {
  const { pc_name, limit = 100 } = req.query;
  
  try {
    const logs = await db.getTemperatureLogs(pc_name, limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching temperature logs:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`✅ API listening on http://0.0.0.0:${port}`);
  console.log(`✅ Local API: http://127.0.0.1:${port}`);
  console.log(`✅ Remote API: http://[YOUR_IP]:${port}`);
  console.log(`✅ Status Page: http://127.0.0.1:${port}/status-page`);
  
  // Initialize status indicator after server starts
  statusIndicator = new StatusIndicator(app, db);
  statusIndicator.logActivity('Server started successfully');
});
