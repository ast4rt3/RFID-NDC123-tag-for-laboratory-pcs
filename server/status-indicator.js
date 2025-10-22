const express = require('express');
const fs = require('fs');
const path = require('path');

class StatusIndicator {
  constructor(server, database) {
    this.server = server;
    this.database = database;
    this.status = {
      server: 'stopped',
      database: 'disconnected',
      connections: 0,
      uptime: 0,
      startTime: null,
      lastActivity: null,
      totalLogs: 0,
      activePCs: []
    };
    
    this.startTime = Date.now();
    this.setupRoutes();
    this.startStatusUpdates();
  }

  setupRoutes() {
    // Status endpoint
    this.server.get('/status', (req, res) => {
      this.updateStatus();
      res.json({
        ...this.status,
        timestamp: new Date().toISOString(),
        serverInfo: {
          version: '1.0.0',
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime()
        }
      });
    });

    // Health check endpoint
    this.server.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime
      });
    });

    // Debug info endpoint
    this.server.get('/debug', (req, res) => {
      this.updateStatus();
      res.json({
        status: this.status,
        memory: process.memoryUsage(),
        environment: process.env,
        connections: this.getConnectionInfo()
      });
    });

    // Serve status page
    this.server.get('/status-page', (req, res) => {
      const statusPage = this.generateStatusPage();
      res.send(statusPage);
    });
  }

  updateStatus() {
    this.status.server = 'running';
    this.status.database = this.database ? 'connected' : 'disconnected';
    this.status.uptime = Date.now() - this.startTime;
    this.status.lastActivity = new Date().toISOString();
    
    // Update connection count if WebSocket server is available
    if (this.server.wss) {
      this.status.connections = this.server.wss.clients.size;
    }
  }

  getConnectionInfo() {
    if (!this.server.wss) return {};
    
    const connections = [];
    this.server.wss.clients.forEach((ws, index) => {
      connections.push({
        id: index,
        readyState: ws.readyState,
        remoteAddress: ws._socket?.remoteAddress,
        connectedAt: ws.connectedAt || 'unknown'
      });
    });
    
    return {
      total: this.server.wss.clients.size,
      connections: connections
    };
  }

  generateStatusPage() {
    return `
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
        .log-viewer {
            background: #1e1e1e;
            color: #00ff00;
            padding: 20px;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 20px;
        }
        .timestamp {
            color: #888;
            font-size: 0.9em;
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
                    <div class="status-dot status-running" id="database-status"></div>
                    <h3>Database</h3>
                </div>
                <div class="metric">
                    <span class="metric-label">Type:</span>
                    <span class="metric-value" id="db-type">In-Memory</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Status:</span>
                    <span class="metric-value" id="db-state">Connected</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Logs:</span>
                    <span class="metric-value" id="total-logs">0</span>
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
        </div>

        <button class="refresh-btn" onclick="refreshStatus()">🔄 Refresh Status</button>

        <div class="log-viewer" id="log-viewer">
            <div class="timestamp">[${new Date().toISOString()}] Server status page loaded</div>
        </div>
    </div>

    <script>
        let statusInterval;

        function formatUptime(ms) {
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) return days + 'd ' + (hours % 24) + 'h ' + (minutes % 60) + 'm';
            if (hours > 0) return hours + 'h ' + (minutes % 60) + 'm ' + (seconds % 60) + 's';
            if (minutes > 0) return minutes + 'm ' + (seconds % 60) + 's';
            return seconds + 's';
        }

        function addLog(message) {
            const logViewer = document.getElementById('log-viewer');
            const timestamp = new Date().toISOString();
            const logEntry = document.createElement('div');
            logEntry.className = 'timestamp';
            logEntry.textContent = '[' + timestamp + '] ' + message;
            logViewer.appendChild(logEntry);
            logViewer.scrollTop = logViewer.scrollHeight;
        }

        function updateStatus() {
            fetch('/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('server-state').textContent = data.server;
                    document.getElementById('uptime').textContent = formatUptime(data.uptime);
                    document.getElementById('db-type').textContent = data.database;
                    document.getElementById('db-state').textContent = data.database;
                    document.getElementById('active-pcs').textContent = data.connections;
                    document.getElementById('total-logs').textContent = data.totalLogs;
                    document.getElementById('last-activity').textContent = 
                        data.lastActivity ? new Date(data.lastActivity).toLocaleString() : 'Never';
                    
                    // Update status indicators
                    const serverStatus = document.getElementById('server-status');
                    const dbStatus = document.getElementById('connection-status');
                    
                    serverStatus.className = 'status-dot ' + (data.server === 'running' ? 'status-running' : 'status-stopped');
                    dbStatus.className = 'status-dot ' + (data.connections > 0 ? 'status-running' : 'status-warning');
                })
                .catch(error => {
                    addLog('Error fetching status: ' + error.message);
                });
        }

        function refreshStatus() {
            updateStatus();
            addLog('Status refreshed manually');
        }

        // Auto-refresh every 5 seconds
        statusInterval = setInterval(updateStatus, 5000);
        
        // Initial load
        updateStatus();
        addLog('Status monitoring started');

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (statusInterval) clearInterval(statusInterval);
        });
    </script>
</body>
</html>`;
  }

  startStatusUpdates() {
    // Update status every 30 seconds
    setInterval(() => {
      this.updateStatus();
    }, 30000);
  }

  logActivity(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
    this.status.lastActivity = new Date().toISOString();
  }

  updateConnectionCount(count) {
    this.status.connections = count;
  }

  updateActivePCs(pcs) {
    this.status.activePCs = pcs;
  }
}

module.exports = StatusIndicator;

