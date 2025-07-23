const WebSocket = require('ws');
const os = require('os');
const fs = require('fs');
const path = require('path');

const pcName = os.hostname();
const wsUrl = 'ws://localhost:8080'; // Change to server IP if not local

function sendMessage(type) {
  const ws = new WebSocket(wsUrl);
  ws.on('open', () => {
    ws.send(JSON.stringify({ type, pc_name: pcName }));
    setTimeout(() => ws.close(), 1000); // Give time to send
  });
}

// On startup
if (process.argv[2] === 'start') {
  sendMessage('start');
}

// On shutdown
if (process.argv[2] === 'stop') {
  sendMessage('stop');
}