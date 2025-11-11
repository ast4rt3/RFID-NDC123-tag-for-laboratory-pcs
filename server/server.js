const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');
const os = require('os');
const Database = require('./database');

// Load environment variables
require('dotenv').config();

// Get IPv4 address
function getIPv4Address() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1'; // Fallback to localhost
}

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
}).catch(err => {
  console.error('❌ Database connection error:', err.message);
});

// Store active sessions in memory
const activeSessions = {}; // { clientId: { pc_name, start_time } }
const appActiveSessions = {}; // { clientId: { app_name, start_time } }

// Get IPv4 address
const ipv4Address = getIPv4Address();

// WebSocket server - bind to all interfaces for remote connections
const wss = new WebSocket.Server({ port: wsPort, host: '0.0.0.0' });
console.log(`✅ Server started - ipv4Address: ws://${ipv4Address}:${wsPort}`);

// On connection
wss.on('connection', ws => {
  let clientId = null;

  ws.on('message', async (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error.message);
      return;
    }

    if (data.type === 'start') {
      // PC starts
      if (!clientId) {
        clientId = data.pc_name;
        console.log(`💻 PC connected: ${clientId}`);
      } else {
        clientId = data.pc_name;
      }
      const startTime = new Date();
      // Store as ISO string to preserve timezone
      const formattedStart = startTime.toISOString();
      activeSessions[clientId] = { start_time: formattedStart };
      appActiveSessions[clientId] = {}; // Initialize app session tracking
      try {
        await db.updatePCStatus(clientId, true, formattedStart, formattedStart);
      } catch (error) {
        console.error(`❌ [${clientId}] Failed to update PC status:`, error.message);
      }
    } else if (data.type === 'stop') {
      // PC stops
      if (activeSessions[data.pc_name]) {
        const endTime = new Date();
        const formattedEnd = endTime.toISOString();
        const startTime = activeSessions[data.pc_name].start_time;
        // Duration calculation
        const startDate = new Date(startTime);
        const duration = Math.floor((endTime - startDate) / 1000);
        // Save to database
        try {
          await db.insertTimeLog(data.pc_name, startTime, formattedEnd, duration);
          await db.updatePCStatus(data.pc_name, false, formattedEnd, formattedEnd);
        } catch (error) {
          console.error(`❌ [${data.pc_name}] Failed to save stop event:`, error.message);
        }
        delete activeSessions[data.pc_name];
        delete appActiveSessions[data.pc_name];
      }
    } else if (
      data.type === 'app_usage_start'
    ) {
      // Start tracking a new app session for this client
      if (!appActiveSessions[clientId]) appActiveSessions[clientId] = {};
      const now = new Date();
      const formattedNow = now.toISOString();
      appActiveSessions[clientId][data.app_name] = { start_time: formattedNow };
      try {
        await db.updatePCStatus(clientId, true, formattedNow, formattedNow);
      } catch (error) {
        console.error(`❌ [${clientId}] Failed to update PC status on app_usage_start:`, error.message);
      }
    } else if (
      data.type === 'app_usage_end'
    ) {
      // End the app session and log to DB
      if (appActiveSessions[clientId] && appActiveSessions[clientId][data.app_name]) {
        const startTime = appActiveSessions[clientId][data.app_name].start_time;
        const endTime = new Date();
        const formattedEnd = endTime.toISOString();
        const startDate = new Date(startTime);
        const duration = Math.floor((endTime - startDate) / 1000);
        try {
          await db.insertAppUsageLog(
            data.pc_name,
            data.app_name,
            startTime,
            formattedEnd,
            duration,
            data.memory_usage_bytes,
            data.cpu_percent,
            data.gpu_percent
          );
          await db.updatePCStatus(clientId, true, formattedEnd, formattedEnd);
        } catch (error) {
          console.error(`❌ [${clientId}] Failed to save app_usage_end:`, error.message);
        }
        delete appActiveSessions[clientId][data.app_name];
      }
    } else if (
      data.type === 'app_usage_update'
    ) {
      // Update the end_time and duration for the current app session
      if (appActiveSessions[clientId] && appActiveSessions[clientId][data.app_name]) {
        const startTime = appActiveSessions[clientId][data.app_name].start_time;
        const endTime = new Date();
        const formattedEnd = endTime.toISOString();
        const startDate = new Date(startTime);
        const duration = Math.floor((endTime - startDate) / 1000);
        try {
          await db.insertAppUsageLog(
            data.pc_name,
            data.app_name,
            startTime,
            formattedEnd,
            duration,
            data.memory_usage_bytes,
            data.cpu_percent,
            data.gpu_percent
          );
          await db.updatePCStatus(clientId, true, formattedEnd, formattedEnd);
        } catch (error) {
          console.error(`❌ [${clientId}] Failed to save app_usage_update:`, error.message);
        }
      }
    } else if (data.type === 'system_info') {
      // Handle system information
      try {
        await db.upsertSystemInfo(
          data.pc_name,
          data.cpu_model,
          data.cpu_cores,
          data.cpu_speed_ghz,
          data.total_memory_gb,
          data.os_platform,
          data.os_version,
          data.hostname
        );
      } catch (error) {
        console.error(`❌ [${data.pc_name}] Failed to upsert system info:`, error.message);
      }
    } else if (data.type === 'idle_status') {
      // Handle idle status
      try {
        await db.updatePCStatus(data.pc_name, null, null, null, data.is_idle);
      } catch (error) {
        console.error(`❌ [${data.pc_name}] Failed to update idle status:`, error.message);
      }
    } else if (data.type === 'browser_activity') {
      // Handle browser activity
      try {
        await db.insertBrowserSearchLog(
          data.pc_name,
          data.browser,
          data.url,
          data.search_query,
          data.search_engine,
          data.timestamp
        );
      } catch (error) {
        console.error(`❌ [${data.pc_name}] Failed to insert browser activity:`, error.message);
      }
    }
    
  });

  ws.on('close', () => {
    if (clientId && activeSessions[clientId]) {
      console.log(`💻 PC disconnected: ${clientId}`);
      const endTime = new Date();
      const formattedEnd = endTime.toISOString();
      const startTime = activeSessions[clientId].start_time;
      const startDate = new Date(startTime);
      const duration = Math.floor((endTime - startDate) / 1000);
      db.insertTimeLog(clientId, startTime, formattedEnd, duration).catch(err => {
        console.error(`[${clientId}] Error on disconnect:`, err.message);
      });
      db.updatePCStatus(clientId, false, formattedEnd, formattedEnd).catch(err => {
        console.error(`[${clientId}] Error updating status on disconnect:`, err.message);
      });
      delete activeSessions[clientId];
    }
  });

  ws.on('error', (error) => {
    console.error(`[${clientId || 'unknown'}] WebSocket error:`, error.message);
  });
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

app.listen(port, '0.0.0.0', () => {
  // Server startup message already logged above
});

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
