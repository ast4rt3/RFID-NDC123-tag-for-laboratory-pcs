const WebSocket = require('ws');
const os = require('os');
const activeWin = require('active-win'); // <--- Add this
const pidusage = require('pidusage');
const si = require('systeminformation'); // For CPU temperature monitoring
const WindowsHardwareMonitor = require('./windows-hardware-monitor'); // Windows-specific monitoring
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
// const sqlite3 = require('sqlite3').verbose(); // Temporarily disabled


const config = require('./config');
const windowsMonitor = new WindowsHardwareMonitor(); // Initialize Windows hardware monitor
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
console.log('PC Name:', pcName);

// Load config and log details
console.log('Loading configuration...');
let wsUrl;
try {
  console.log('Config object:', config);
  console.log('Config serverIP:', config.config?.serverIP);
  wsUrl = config.getWebSocketURL(); // Use config
  console.log('WebSocket URL:', wsUrl);
} catch (error) {
  console.error('Error loading config:', error);
  wsUrl = 'ws://127.0.0.1:8080'; // Fallback
  console.log('Using fallback WebSocket URL:', wsUrl);
}

const ws = new WebSocket(wsUrl);

// Function to collect and send system information (once on startup)
async function sendSystemInfo() {
  try {
    console.log('Collecting system information...');

    // Get CPU information
    const cpuInfo = await si.cpu();
    const cpuModel = cpuInfo.brand || 'Unknown';
    const cpuCores = cpuInfo.cores || os.cpus().length;
    const cpuSpeedGhz = cpuInfo.speed || (os.cpus()[0]?.speed / 1000) || 0;

    // Get memory information
    const memInfo = await si.mem();
    const totalMemoryGb = (memInfo.total / (1024 ** 3)).toFixed(2);

    // Get OS information
    const osInfo = await si.osInfo();
    const osPlatform = os.platform();
    const osVersion = osInfo.distro || os.release();
    const hostname = os.hostname();

    const systemInfo = {
      type: 'system_info',
      pc_name: pcName,
      cpu_model: cpuModel,
      cpu_cores: cpuCores,
      cpu_speed_ghz: cpuSpeedGhz,
      total_memory_gb: parseFloat(totalMemoryGb),
      os_platform: osPlatform,
      os_version: osVersion,
      hostname: hostname
    };

    console.log('System Information:', systemInfo);
    ws.send(JSON.stringify(systemInfo));
    console.log('✅ System information sent to server');

  } catch (err) {
    console.error('Error collecting system information:', err.message);
  }
}

// Add explicit logging for connection, error, and close events
ws.on('open', async () => {
  console.log('WebSocket connected to', wsUrl);
  ws.send(JSON.stringify({ type: 'start', pc_name: pcName }));
  console.log('Session started');

  // Send system information once on startup
  await sendSystemInfo();

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

  // Function to get CPU temperature (Windows-optimized)
  async function getCpuTemperature() {
    try {
      // On Windows, use our custom Windows monitor
      if (os.platform() === 'win32') {
        const temp = await windowsMonitor.getCpuTemperature();
        if (temp !== null) {
          return temp;
        }
      }

      // Fallback to systeminformation for Linux/macOS
      const temp = await si.cpuTemperature();
      if (temp && temp.main && temp.main !== -1) {
        return temp.main;
      }
      return null;
    } catch (err) {
      console.error('Error getting CPU temperature:', err.message);
      return null;
    }
  }

  // Function to get hardware monitoring data (temperature + overclocking)
  async function getHardwareData() {
    try {
      // On Windows, get all data at once for efficiency
      if (os.platform() === 'win32') {
        return await windowsMonitor.getAllData();
      }

      // On other platforms, just get temperature
      const temp = await getCpuTemperature();
      return {
        cpuTemperature: temp,
        isCpuOverclocked: null,
        isRamOverclocked: null
      };
    } catch (err) {
      console.error('Error getting hardware data:', err.message);
      return {
        cpuTemperature: null,
        isCpuOverclocked: null,
        isRamOverclocked: null
      };
    }
  }

  console.log("Connecting to WebSocket at:", wsUrl);

  setInterval(async () => {
    console.log('App usage interval running...');
    const result = await activeWin();
    console.log('🔍 Active window result:', result);
    if (!result) return;

    const appName = result.owner.name;
    const processId = result.owner.processId;
    const memoryUsage = result.memoryUsage;

    let cpuPercent = null;
    try {
      const stats = await pidusage(processId);
      cpuPercent = stats.cpu;
    } catch (e) {
      cpuPercent = null;
    }

    if (IGNORED_APPS.includes(appName)) {
      return;
    }
    const now = new Date();

    // Get hardware monitoring data (temperature + overclocking status)
    const hardwareData = await getHardwareData();

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
          gpu_percent: gpuPercent,
          cpu_temperature: hardwareData.cpuTemperature,
          is_cpu_overclocked: hardwareData.isCpuOverclocked,
          is_ram_overclocked: hardwareData.isRamOverclocked
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
          gpu_percent: gpuPercent,
          cpu_temperature: hardwareData.cpuTemperature,
          is_cpu_overclocked: hardwareData.isCpuOverclocked,
          is_ram_overclocked: hardwareData.isRamOverclocked
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
          gpu_percent: gpuPercent,
          cpu_temperature: hardwareData.cpuTemperature,
          is_cpu_overclocked: hardwareData.isCpuOverclocked,
          is_ram_overclocked: hardwareData.isRamOverclocked
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
          gpu_percent: gpuPercent,
          cpu_temperature: hardwareData.cpuTemperature,
          is_cpu_overclocked: hardwareData.isCpuOverclocked,
          is_ram_overclocked: hardwareData.isRamOverclocked
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
  console.error('Failed to connect to:', wsUrl);
  console.error('Please check:');
  console.error('1. Server is running on the correct IP and port');
  console.error('2. Firewall allows connections on port 8080');
  console.error('3. Config file has the correct server IP');
});

ws.on('close', () => {
  console.log('WebSocket closed');
  console.log('Attempting to reconnect in 5 seconds...');
  setTimeout(() => {
    console.log('Reconnecting...');
    // You could implement reconnection logic here
  }, 5000);
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