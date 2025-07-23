const WebSocket = require('ws');
const os = require('os');
const activeWin = require('active-win'); // <--- Add this

const pcName = os.hostname();
const wsUrl = 'ws://localhost:8080'; // Change to server IP if not local

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  ws.send(JSON.stringify({ type: 'start', pc_name: pcName }));
  console.log('Session started');

  // --- App usage tracking ---
  let lastApp = null;
  let lastStart = new Date();

  setInterval(async () => {
    const result = await activeWin();
    if (!result) return;

    const appName = result.owner.name;
    const now = new Date();
    console.log('Sending app usage:', { ...result });
    if (lastApp && appName !== lastApp) {
      const duration = Math.floor((now - lastStart) / 1000);
      // Send app usage to server
      ws.send(JSON.stringify({
        type: 'app_usage',
        pc_name: pcName,
        app_name: lastApp,
        start_time: lastStart,
        end_time: now,
        duration_seconds: duration
      }));
      lastStart = now;
    }
    lastApp = appName;
  }, 5000); // Check every 5 seconds
  // --- End app usage tracking ---
});


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