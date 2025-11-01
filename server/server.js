const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');
const Database = require('./database');

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

// Store active sessions in memory
const activeSessions = {}; // { clientId: { pc_name, start_time } }
const appActiveSessions = {}; // { clientId: { app_name, start_time } }

// WebSocket server - bind to all interfaces for remote connections
const wss = new WebSocket.Server({ port: wsPort, host: '0.0.0.0' });
console.log(`✅ WebSocket listening on ws://0.0.0.0:${wsPort}`);
console.log(`✅ Local connections: ws://127.0.0.1:${wsPort}`);
console.log(`✅ Remote connections: ws://192.168.141.106:${wsPort}`);

// On connection
wss.on('connection', ws => {
  console.log('💻 PC connected');
  let clientId = null;

  ws.on('message', msg => {
    const data = JSON.parse(msg);

    if (data.type === 'start') {
      // PC starts
      clientId = data.pc_name;
      const startTime = new Date();
      activeSessions[clientId] = { start_time: startTime };
      appActiveSessions[clientId] = {}; // Initialize app session tracking
      console.log(`▶ Started session for ${clientId} at ${startTime}`);
    } else if (data.type === 'system_info') {
      // Receive and store system information (one-time)
      console.log(`📊 Received system info from ${data.pc_name}`);
      db.upsertSystemInfo(
        data.pc_name,
        data.cpu_model,
        data.cpu_cores,
        data.cpu_speed_ghz,
        data.total_memory_gb,
        data.os_platform,
        data.os_version,
        data.hostname
      ).catch(err => {
        console.error('Error saving system info:', err);
      });
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
          data.gpu_percent,
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
          data.gpu_percent,
          data.cpu_temperature,
          data.is_cpu_overclocked,
          data.is_ram_overclocked
        );
      }
    }
    
    // Browser activity handling has been removed
  });

  ws.on('close', () => {
    if (clientId && activeSessions[clientId]) {
      const endTime = new Date();
      const startTime = activeSessions[clientId].start_time;
      const duration = Math.floor((endTime - startTime) / 1000);

      db.insertTimeLog(clientId, startTime, endTime, duration);

      delete activeSessions[clientId];
    }
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

// Browser logs endpoint has been removed

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ API listening on http://0.0.0.0:${port}`);
});
