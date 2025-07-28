const WebSocket = require('ws');
const os = require('os');
const activeWin = require('active-win'); // <--- Add this
const pidusage = require('pidusage');
const { exec } = require('child_process');
const config = require('./config');
const fs = require('fs');
const logStream = fs.createWriteStream('rfid-client-debug.log', { flags: 'a' });
const origLog = console.log;
console.log = function(...args) {
  logStream.write(args.join(' ') + '\n');
  origLog.apply(console, args);
};
const origError = console.error;
console.error = function(...args) {
  logStream.write('[ERROR] ' + args.join(' ') + '\n');
  origError.apply(console, args);
};

const pcName = os.hostname();
const wsUrl = config.getWebSocketURL(); // Use config instead of hardcoded localhost

const ws = new WebSocket(wsUrl);

// Add explicit logging for connection, error, and close events
ws.on('open', () => {
  console.log('WebSocket connected to', wsUrl);
  ws.send(JSON.stringify({ type: 'start', pc_name: pcName }));
  console.log('Session started');

  // --- App usage tracking ---
  let lastApp = null;
  let lastStart = new Date();
  let appActive = false; // Track if an app is currently active

  const IGNORED_APPS = [
    // Add more as needed
  ];

  function getSystemGpuUsage(callback) {
    exec('powershell.exe Get-Counter -Counter "\\GPU Engine(*)\\Utilization Percentage"', (err, stdout, stderr) => {
      if (err) {
        callback(null);
        return;
      }
      // Parse the output to get the average GPU usage
      const matches = stdout.match(/\\GPU Engine\([^)]+\)\\Utilization Percentage\s+:\s+([0-9.]+)/g);
      if (!matches) {
        callback(null);
        return;
      }
      const usages = matches.map(line => parseFloat(line.split(':').pop()));
      // Filter out NaN and sum only non-zero engines (usually the first is the main GPU)
      const validUsages = usages.filter(u => !isNaN(u));
      const avgUsage = validUsages.length ? validUsages.reduce((a, b) => a + b, 0) / validUsages.length : null;
      callback(avgUsage);
    });
  }

  setInterval(async () => {
    console.log('App usage interval running...');
    const result = await activeWin();
    console.log('activeWin result:', result);
    if (!result) return;

    const appName = result.owner.name;
    const processId = result.owner.processId;
    const memoryUsage = result.memoryUsage; // in bytes

    let cpuPercent = null;
    try {
      const stats = await pidusage(processId);
      cpuPercent = stats.cpu; // percent
    } catch (e) {
      cpuPercent = null;
    }

    if (IGNORED_APPS.includes(appName)) {
      // If the current app is ignored, do not update lastApp or lastStart
      return;
    }
    const now = new Date();

    // Get GPU usage and send the log inside the callback
    getSystemGpuUsage((gpuPercent) => {
      if (!appActive) {
        // First non-ignored app seen
        ws.send(JSON.stringify({
          type: 'app_usage_start',
          pc_name: pcName,
          app_name: appName,
          start_time: toPhilippineTimeString(now),
          end_time: toPhilippineTimeString(now),
          duration_seconds: 0,
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
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
          start_time: toPhilippineTimeString(lastStart),
          end_time: toPhilippineTimeString(now),
          duration_seconds: Math.floor((now - lastStart) / 1000),
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
        }));
        console.log('Sent app_usage_end for', lastApp);

        ws.send(JSON.stringify({
          type: 'app_usage_start',
          pc_name: pcName,
          app_name: appName,
          start_time: toPhilippineTimeString(now),
          end_time: toPhilippineTimeString(now),
          duration_seconds: 0,
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
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
          start_time: toPhilippineTimeString(lastStart),
          end_time: toPhilippineTimeString(now),
          duration_seconds: Math.floor((now - lastStart) / 1000),
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
        }));
        console.log('Sent app_usage_update for', appName);
      }
    });
  }, 3000); // 3 seconds
  // --- End app usage tracking ---
});

// Add error and close event logging
ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});
ws.on('close', () => {
  console.log('WebSocket closed');
});

// Robust helper to format date in Philippine Standard Time (UTC+8) in 24-hour format
function toPhilippineTimeString(date) {
  // Get UTC time, then add 8 hours for Philippine time
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const phTime = new Date(utc + (8 * 60 * 60 * 1000));
  const year = phTime.getUTCFullYear();
  const month = String(phTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(phTime.getUTCDate()).padStart(2, '0');
  const hour = String(phTime.getUTCHours()).padStart(2, '0');
  const minute = String(phTime.getUTCMinutes()).padStart(2, '0');
  const second = String(phTime.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}


// Listen for shutdown/logoff signals
function handleExit() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'stop', pc_name: pcName }));
    ws.close();
    console.log('Session stopped');
  }
  // On shutdown, finalize the last app usage if needed
  if (appActive && lastApp) {
    const now = new Date();
    ws.send(JSON.stringify({
      type: 'app_usage_end',
      pc_name: pcName,
      app_name: lastApp,
      start_time: toPhilippineTimeString(lastStart),
      end_time: toPhilippineTimeString(now),
      duration_seconds: Math.floor((now - lastStart) / 1000),
      memory_usage_bytes: null,
      cpu_percent: null,
      gpu_percent: null
    }));
  }
  process.exit();
}

process.on('SIGINT', handleExit);   // Ctrl+C
process.on('SIGTERM', handleExit);  // Termination
process.on('SIGHUP', handleExit);   // Terminal closed
process.on('exit', handleExit);

// Keep the process alive
setInterval(() => {}, 1000);