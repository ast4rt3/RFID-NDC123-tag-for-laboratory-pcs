const WebSocket = require('ws');
const os = require('os');

const pcName = os.hostname();
const wsUrl = 'ws://localhost:8080'; // Change to server IP if not local

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'start', pc_name: pcName }));
  console.log('Session started');
});

// Listen for shutdown/logoff signals
function handleExit() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'stop', pc_name: pcName }));
    ws.close();
    console.log('Session stopped');
  }
  process.exit();
}

process.on('SIGINT', handleExit);   // Ctrl+C
process.on('SIGTERM', handleExit);  // Termination
process.on('SIGHUP', handleExit);   // Terminal closed
process.on('exit', handleExit);

// Keep the process alive
setInterval(() => {}, 1000);