const express = require('express');
const WebSocket = require('ws');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;
const wsPort = 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'juglone', 
});


db.connect(err => {
  if (err) console.error('DB error:', err);
  else console.log('✅ Connected to MySQL');
});

// Store active sessions in memory
const activeSessions = {}; // { clientId: { pc_name, start_time } }

// WebSocket server
const wss = new WebSocket.Server({ port: wsPort });
console.log(`✅ WebSocket listening on ws://localhost:${wsPort}`);

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
      console.log(`▶ Started session for ${clientId} at ${startTime}`);
    } else if (data.type === 'stop') {
      // PC stops
      if (activeSessions[data.pc_name]) {
        const endTime = new Date();
        const startTime = activeSessions[data.pc_name].start_time;
        const duration = Math.floor((endTime - startTime) / 1000);

        // Save to database
        const sql = 'INSERT INTO time_logs (pc_name, start_time, end_time, duration_seconds) VALUES (?, ?, ?, ?)';
        db.query(sql, [data.pc_name, startTime, endTime, duration], (err) => {
          if (err) console.error('DB insert error:', err);
          else console.log(`💾 Log saved for ${data.pc_name}`);
        });

        delete activeSessions[data.pc_name];
      }
    }
  });

  ws.on('close', () => {
    if (clientId && activeSessions[clientId]) {
      const endTime = new Date();
      const startTime = activeSessions[clientId].start_time;
      const duration = Math.floor((endTime - startTime) / 1000);

      const sql = 'INSERT INTO time_logs (pc_name, start_time, end_time, duration_seconds) VALUES (?, ?, ?, ?)';
      db.query(sql, [clientId, startTime, endTime, duration], (err) => {
        if (err) console.error('DB insert error on close:', err);
        else console.log(`💾 Log saved for ${clientId} on close`);
      });

      delete activeSessions[clientId];
    }
  });
});



// API to get logs
app.get('/logs', (req, res) => {
  db.query('SELECT * FROM time_logs ORDER BY start_time DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(results);
  });
});

app.listen(port, () => {
  console.log(`✅ API listening on http://localhost:${port}`);
});
