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
  let appActive = false; // Track if an app is currently active

  const IGNORED_APPS = [
    // Add more as needed
  ];

  setInterval(async () => {
    console.log('App usage interval running...');
    const result = await activeWin();
    console.log('activeWin result:', result);
    if (!result) return;

    const appName = result.owner.name;
    if (IGNORED_APPS.includes(appName)) {
      // If the current app is ignored, do not update lastApp or lastStart
      return;
    }

    const now = new Date();

    if (!appActive) {
      // First non-ignored app seen
      ws.send(JSON.stringify({
        type: 'app_usage_start',
        pc_name: pcName,
        app_name: appName,
        start_time: now.toISOString().slice(0, 19).replace('T', ' '),
        end_time: now.toISOString().slice(0, 19).replace('T', ' '),
        duration_seconds: 0
      }));
      console.log('Sent app_usage_start for', appName);
      lastApp = appName;
      lastStart = now;
      appActive = true;
    } else if (appName !== lastApp) {
      // App changed: finalize previous, start new
      ws.send(JSON.stringify({
        type: 'app_usage_end',
        pc_name: pcName,
        app_name: lastApp,
        start_time: lastStart.toISOString().slice(0, 19).replace('T', ' '),
        end_time: now.toISOString().slice(0, 19).replace('T', ' '),
        duration_seconds: Math.floor((now - lastStart) / 1000)
      }));
      console.log('Sent app_usage_end for', lastApp);

      ws.send(JSON.stringify({
        type: 'app_usage_start',
        pc_name: pcName,
        app_name: appName,
        start_time: now.toISOString().slice(0, 19).replace('T', ' '),
        end_time: now.toISOString().slice(0, 19).replace('T', ' '),
        duration_seconds: 0
      }));
      console.log('Sent app_usage_start for', appName);

      lastApp = appName;
      lastStart = now;
    } else {
      // App is still active, update
      ws.send(JSON.stringify({
        type: 'app_usage_update',
        pc_name: pcName,
        app_name: appName,
        start_time: lastStart.toISOString().slice(0, 19).replace('T', ' '),
        end_time: now.toISOString().slice(0, 19).replace('T', ' '),
        duration_seconds: Math.floor((now - lastStart) / 1000)
      }));
      console.log('Sent app_usage_update for', appName);
    }
  }, 2000); // Check every 5 seconds
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