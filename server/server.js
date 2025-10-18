const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const cors = require('cors');
const SupabaseDB = require('./supabase-client');

// Load environment variables
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Supabase database client
const db = new SupabaseDB();

// Test database connection
db.testConnection().then(connected => {
  if (!connected) {
    console.error('❌ Failed to connect to Supabase. Exiting...');
    process.exit(1);
  }
});

// Store active sessions in memory
const activeSessions = {}; // { clientId: { pc_name, start_time } }
const appActiveSessions = {}; // { clientId: { app_name, start_time } }

// WebSocket server
const wss = new WebSocket.Server({ port: wsPort, host: '0.0.0.0' });
console.log(`✅ WebSocket listening on ws://0.0.0.0:${wsPort}`);

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
          data.gpu_percent
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
      db.insertBrowserSearchLog(
        data.pc_name,
        data.browser,
        data.url,
        data.search_query,
        data.search_engine,
        data.timestamp
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
  console.log(`✅ API listening on http://0.0.0.0:${port}`);
});
