const WebSocket = require('ws');
const os = require('os');
const activeWin = require('active-win');
const pidusage = require('pidusage');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');
const sqlite3 = require('sqlite3');

const config = require('./config');
const logStream = fs.createWriteStream('rfid-client-debug.log', { flags: 'a' });
const origLog = console.log;
console.log = function (...args) {
  logStream.write(args.join(' ') + '\n');
  origLog.apply(console, args);
};
const origError = console.error;
console.error = function (...args) {
  logStream.write('[ERROR] ' + args.join(' ') + '\n');
  origError.apply(console, args);
};

const pcName = os.hostname();
console.log('PC Name:', pcName);

// Buffer file path for storing data when disconnected
const bufferFilePath = path.join(__dirname, 'data-buffer.json');

// Load config and log details
console.log('Loading configuration...');
let wsUrl;
try {
  console.log('Config object:', config);
  console.log('Config serverIP:', config.config?.serverIP);
  wsUrl = config.getWebSocketURL();
  console.log('WebSocket URL:', wsUrl);
} catch (error) {
  console.error('Error loading config:', error);
  wsUrl = 'ws://127.0.0.1:8080'; // Fallback
  console.log('Using fallback WebSocket URL:', wsUrl);
}

// Connection state
let ws = null;
let reconnectAttempts = 0;
let reconnectTimeout = null;
let isReconnecting = false;
const MAX_RECONNECT_ATTEMPTS = Infinity; // Keep trying indefinitely
const INITIAL_RECONNECT_DELAY = 1000; // Start with 1 second
const MAX_RECONNECT_DELAY = 30000; // Max 30 seconds
const HEARTBEAT_INTERVAL = 30000; // Send ping every 30 seconds
const HEARTBEAT_TIMEOUT = 60000; // Consider dead if no pong for 60 seconds

// App tracking state (persists across reconnections)
let lastApp = null;
let lastStart = new Date();
let appActive = false;
let lastActivityTime = new Date();
let isIdle = false;
let idleStartTime = null;
const IDLE_THRESHOLD_MS = 1 * 60 * 1000; // 1 minute

// Browser tracking to prevent duplicate logs
let lastBrowserActivityKey = null;

// Interval references (for cleanup)
let appUsageInterval = null;
let idleCheckInterval = null;
let heartbeatInterval = null;
let heartbeatTimeout = null;
let systemInfoTimeout = null;
let browserHistoryInterval = null;

const IGNORED_APPS = [
  // Add more as needed
];

const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const browserHistoryTempDir = path.join(os.tmpdir(), 'rfid-browser-history');
if (!fs.existsSync(browserHistoryTempDir)) {
  try {
    fs.mkdirSync(browserHistoryTempDir, { recursive: true });
  } catch (err) {
    console.error('❌ Failed to create temp dir for browser history:', err.message);
  }
}

const CHROME_EPOCH_OFFSET_MS = 11644473600000;
const BROWSER_HISTORY_POLL_INTERVAL = 7000;
const CHROMIUM_HISTORY_SOURCES = [
  {
    key: 'chrome',
    label: 'Google Chrome',
    path: path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'History')
  },
  {
    key: 'edge',
    label: 'Microsoft Edge',
    path: path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'History')
  },
  {
    key: 'brave',
    label: 'Brave Browser',
    path: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data', 'Default', 'History')
  }
];
const browserHistoryState = new Map();

// Browser detection and data extraction functions
function isBrowserApp(appName) {
  const browsers = ['chrome', 'firefox', 'edge', 'safari', 'opera', 'brave', 'vivaldi'];
  return browsers.some(browser => appName.toLowerCase().includes(browser));
}

function extractBrowserData(appName, windowTitle, windowUrl) {
  let searchQuery = null;
  let searchEngine = null;

  console.log('🔍 Extracting browser data from:', { appName, windowTitle, windowUrl });

  // Extract search query from URL
  if (windowUrl) {
    try {
      const url = new URL(windowUrl);
      console.log('🔍 Parsed URL:', url.hostname, url.searchParams.toString());

      // Google search (multiple variations)
      if (url.hostname.includes('google.com')) {
        searchQuery = url.searchParams.get('q');
        searchEngine = 'Google';
      }
      // Bing search
      else if (url.hostname.includes('bing.com')) {
        searchQuery = url.searchParams.get('q');
        searchEngine = 'Bing';
      }
      // Yahoo search
      else if (url.hostname.includes('yahoo.com')) {
        searchQuery = url.searchParams.get('p') || url.searchParams.get('q');
        searchEngine = 'Yahoo';
      }
      // DuckDuckGo search
      else if (url.hostname.includes('duckduckgo.com')) {
        searchQuery = url.searchParams.get('q');
        searchEngine = 'DuckDuckGo';
      }
      // YouTube search
      else if (url.hostname.includes('youtube.com')) {
        searchQuery = url.searchParams.get('search_query');
        searchEngine = 'YouTube';
      }
      // Brave search
      else if (url.hostname.includes('search.brave.com')) {
        searchQuery = url.searchParams.get('q');
        searchEngine = 'Brave';
      }
      // Startpage search
      else if (url.hostname.includes('startpage.com')) {
        searchQuery = url.searchParams.get('query');
        searchEngine = 'Startpage';
      }

      console.log('🔍 URL extraction result:', { searchQuery, searchEngine });
    } catch (e) {
      console.log('🔍 Invalid URL:', e.message);
    }
  }



  // Fallback: Extract from window title (more comprehensive patterns)
  if (!searchQuery && windowTitle) {
    console.log('🔍 Trying title extraction for:', windowTitle);

    // More comprehensive title patterns
    const titlePatterns = [
      // Microsoft Edge variations (with profile names)
      /^(.+?) - Search - (?:Personal|Work|Profile \d+) - Microsoft​? Edge$/,
      /^(.+?) - Search and \d+ more pages? - (?:Personal|Work|Profile \d+) - Microsoft​? Edge$/,
      /^(.+?) - Microsoft​? Edge$/,

      // Google variations
      /^(.+?) - Google Search$/,
      /^(.+?) - Google$/,
      /Google Search - (.+)$/,

      // Bing variations
      /^(.+?) - Bing$/,
      /^(.+?) - Microsoft Bing$/,

      // Yahoo variations
      /^(.+?) - Yahoo Search$/,
      /^(.+?) - Yahoo$/,

      // DuckDuckGo variations
      /^(.+?) - DuckDuckGo$/,
      /DuckDuckGo - (.+)$/,

      // YouTube variations
      /^(.+?) - YouTube$/,
      /YouTube - (.+)$/,

      // Generic search patterns
      /^(.+?) - Search$/,
      /Search results for "(.+?)"/,
      /"(.+?)" - Search results/,

      // Browser-specific patterns (generic)
      /^(.+?) - Chrome$/,
      /^(.+?) - Firefox$/,
      /^(.+?) - Edge$/,
      /^(.+?) - Brave$/,

      // Brave specific
      /^(.+?) - Brave$/,
      /^(.+?) and \d+ more pages? - Brave$/
    ];

    for (const pattern of titlePatterns) {
      const match = windowTitle.match(pattern);
      if (match) {
        searchQuery = match[1] || match[2];

        // Determine search engine from title
        if (windowTitle.includes('Google')) searchEngine = 'Google';
        else if (windowTitle.includes('Bing')) searchEngine = 'Bing';
        else if (windowTitle.includes('Yahoo')) searchEngine = 'Yahoo';
        else if (windowTitle.includes('DuckDuckGo')) searchEngine = 'DuckDuckGo';
        else if (windowTitle.includes('YouTube')) searchEngine = 'YouTube';
        else if (windowTitle.includes('Brave')) searchEngine = 'Brave';
        else searchEngine = 'Unknown';

        console.log('🔍 Title extraction match:', { searchQuery, searchEngine, pattern: pattern.toString() });
        break;
      }
    }
  }

  // Don't use full window title as fallback - it's too noisy
  // Only log browser activity if we have a proper search query or URL

  const result = {
    searchQuery,
    searchEngine,
    isSearchPage: !!searchQuery
  };

  console.log('🔍 Final extraction result:', result);
  return result;
}

function chromeTimeToUnixMs(chromeTime) {
  if (!chromeTime) return 0;
  return Math.round(chromeTime / 1000 - CHROME_EPOCH_OFFSET_MS);
}

function getHostnameFromUrl(url) {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function copyFileSafely(source, destination) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destination);
    fs.promises.mkdir(dir, { recursive: true }).catch(() => { /* ignore */ }).finally(() => {
      const readStream = fs.createReadStream(source);
      readStream.on('error', reject);
      const writeStream = fs.createWriteStream(destination);
      writeStream.on('error', reject);
      writeStream.on('close', resolve);
      readStream.pipe(writeStream);
    });
  });
}

async function readBrowserHistoryRows(source) {
  if (!source.path || !fs.existsSync(source.path)) {
    return [];
  }

  const tempPath = path.join(browserHistoryTempDir, `${source.key}-history.sqlite`);
  try {
    await copyFileSafely(source.path, tempPath);
  } catch (error) {
    console.warn(`⚠️ Unable to copy history for ${source.label}:`, error.message);
    return [];
  }

  return new Promise((resolve) => {
    const rowsResult = [];
    const db = new sqlite3.Database(tempPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.warn(`⚠️ Unable to open history DB for ${source.label}:`, err.message);
        return resolve([]);
      }

      const query = `
        SELECT urls.url AS url, urls.title AS title, visits.visit_time AS visit_time
        FROM visits
        JOIN urls ON visits.url = urls.id
        WHERE urls.url NOT LIKE 'chrome://%' AND urls.url NOT LIKE 'edge://%' AND urls.url NOT LIKE 'brave://%'
        ORDER BY visits.visit_time DESC
        LIMIT 25;
      `;

      db.all(query, [], (error, rows) => {
        db.close();
        if (error) {
          console.warn(`⚠️ Failed to read history for ${source.label}:`, error.message);
          return resolve([]);
        }
        resolve(rows || rowsResult);
      });
    });
  });
}

async function pollBrowserHistory() {
  for (const source of CHROMIUM_HISTORY_SOURCES) {
    try {
      const rows = await readBrowserHistoryRows(source);
      if (!rows.length) {
        continue;
      }

      const latestVisit = rows[0]?.visit_time || 0;
      if (!browserHistoryState.has(source.key)) {
        browserHistoryState.set(source.key, latestVisit);
        continue;
      }

      const lastProcessed = browserHistoryState.get(source.key) || 0;
      const newRows = rows.filter(row => row.visit_time > lastProcessed);
      if (!newRows.length) {
        continue;
      }

      browserHistoryState.set(source.key, Math.max(latestVisit, lastProcessed));
      newRows.reverse().forEach(row => {
        const visitMs = chromeTimeToUnixMs(row.visit_time);
        if (!visitMs || Number.isNaN(visitMs)) {
          return;
        }
        const timestamp = new Date(visitMs).toISOString();
        const url = row.url || '';
        const hostname = getHostnameFromUrl(url);
        const title = row.title && row.title.trim().length ? row.title : (hostname || 'Unknown page');

        sendMessage({
          type: 'browser_activity',
          pc_name: pcName,
          browser: source.label,
          url,
          search_query: title,
          search_engine: hostname || source.label,
          timestamp
        });
        console.log(`🌐 Logged browser visit from ${source.label}:`, { title, url, timestamp });
      });
    } catch (error) {
      console.warn(`⚠️ Browser history poll failed for ${source.label}:`, error.message);
    }
  }
}

function setupBrowserHistoryTracking() {
  if (browserHistoryInterval) {
    return;
  }
  pollBrowserHistory();
  browserHistoryInterval = setInterval(() => {
    pollBrowserHistory();
  }, BROWSER_HISTORY_POLL_INTERVAL);
}

function extractSearchFromURL(url) {
  try {
    const urlObj = new URL(url);
    let searchQuery = null;
    let searchEngine = null;

    if (urlObj.hostname.includes('google.com') && urlObj.searchParams.has('q')) {
      searchQuery = urlObj.searchParams.get('q');
      searchEngine = 'Google';
    } else if (urlObj.hostname.includes('bing.com') && urlObj.searchParams.has('q')) {
      searchQuery = urlObj.searchParams.get('q');
      searchEngine = 'Bing';
    } else if (urlObj.hostname.includes('yahoo.com') && urlObj.searchParams.has('p')) {
      searchQuery = urlObj.searchParams.get('p');
      searchEngine = 'Yahoo';
    } else if (urlObj.hostname.includes('duckduckgo.com') && urlObj.searchParams.has('q')) {
      searchQuery = urlObj.searchParams.get('q');
      searchEngine = 'DuckDuckGo';
    } else if (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('search_query')) {
      searchQuery = urlObj.searchParams.get('search_query');
      searchEngine = 'YouTube';
    }

    return { searchQuery, searchEngine };
  } catch (e) {
    return { searchQuery: null, searchEngine: null };
  }
}

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

// Buffer management functions
function readBuffer() {
  try {
    if (fs.existsSync(bufferFilePath)) {
      const bufferData = fs.readFileSync(bufferFilePath, 'utf8');
      return JSON.parse(bufferData);
    }
  } catch (error) {
    console.error('Error reading buffer file:', error);
  }
  return { messages: [], lastUpdated: null };
}

function writeBuffer(bufferData) {
  try {
    bufferData.lastUpdated = new Date().toISOString();
    fs.writeFileSync(bufferFilePath, JSON.stringify(bufferData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing buffer file:', error);
    return false;
  }
}

function addToBuffer(message) {
  const buffer = readBuffer();
  // Don't buffer heartbeats - they're not important
  if (message.type === 'heartbeat') {
    return;
  }

  buffer.messages.push({
    ...message,
    bufferedAt: new Date().toISOString()
  });

  // Limit buffer size to prevent excessive memory usage (keep last 1000 messages)
  if (buffer.messages.length > 1000) {
    buffer.messages = buffer.messages.slice(-1000);
    console.log('⚠️ Buffer size limit reached, keeping last 1000 messages');
  }

  writeBuffer(buffer);
  console.log(`💾 Buffered message (${buffer.messages.length} total):`, message.type);
}

function clearBuffer() {
  try {
    if (fs.existsSync(bufferFilePath)) {
      fs.unlinkSync(bufferFilePath);
      console.log('✅ Buffer file cleared');
    }
  } catch (error) {
    console.error('Error clearing buffer file:', error);
  }
}

async function sendBufferedMessages() {
  const buffer = readBuffer();

  if (!buffer.messages || buffer.messages.length === 0) {
    return;
  }

  console.log(`📤 Sending ${buffer.messages.length} buffered messages...`);

  // Send messages one by one with a small delay to avoid overwhelming the server
  let sentCount = 0;
  for (let i = 0; i < buffer.messages.length; i++) {
    const message = buffer.messages[i];

    // Check if connection is still open before sending
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error(`❌ Connection lost while sending buffered messages. ${buffer.messages.length - i} messages remaining.`);
      // Update buffer with remaining messages
      const remainingMessages = buffer.messages.slice(i);
      writeBuffer({ messages: remainingMessages, lastUpdated: buffer.lastUpdated });
      return;
    }

    // Remove bufferedAt timestamp before sending
    const { bufferedAt, ...messageToSend } = message;

    // Send directly via WebSocket (don't use sendMessage to avoid re-buffering)
    try {
      ws.send(JSON.stringify(messageToSend));
      sentCount++;
      console.log(`✅ Sent buffered message ${sentCount}/${buffer.messages.length}: ${message.type}`);

      // Small delay between messages to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 50));
    } catch (error) {
      // If send fails, stop and keep remaining messages in buffer
      console.error(`❌ Failed to send buffered message ${sentCount + 1}/${buffer.messages.length}: ${error.message}`);

      // Update buffer with remaining messages
      const remainingMessages = buffer.messages.slice(i);
      writeBuffer({ messages: remainingMessages, lastUpdated: buffer.lastUpdated });
      return;
    }
  }

  // All messages sent successfully, clear buffer
  console.log(`✅ All ${sentCount} buffered messages sent successfully`);
  clearBuffer();
}

function sendMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      // If send fails, buffer the message
      addToBuffer(message);
      return false;
    }
  } else {
    // Not connected, buffer the message
    addToBuffer(message);
    return false;
  }
}

async function sendSystemInfo() {
  try {
    console.log('Collecting system information...');

    // Collect system information (even if not connected, so we have it ready)
    const [cpu, mem, osInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo()
    ]);

    // Extract CPU model and speed
    const cpuModel = cpu.manufacturer && cpu.brand ? `${cpu.manufacturer} ${cpu.brand}` : cpu.brand || 'Unknown';
    const cpuCores = cpu.cores || 0;
    const cpuSpeedGhz = cpu.speed ? (cpu.speed / 1000) : 0; // Convert MHz to GHz

    // Extract memory (convert bytes to GB)
    const totalMemoryGb = mem.total ? (mem.total / (1024 * 1024 * 1024)) : 0;

    // Extract OS information
    const osPlatform = osInfo.platform || os.platform();
    const osVersion = osInfo.distro || osInfo.release || 'Unknown';
    const hostname = os.hostname();

    // Send system info to server (will be buffered if not connected)
    sendMessage({
      type: 'system_info',
      pc_name: pcName,
      cpu_model: cpuModel,
      cpu_cores: cpuCores,
      cpu_speed_ghz: cpuSpeedGhz,
      total_memory_gb: totalMemoryGb,
      os_platform: osPlatform,
      os_version: osVersion,
      hostname: hostname
    });

    console.log('✅ System information collected and sent:', {
      cpu_model: cpuModel,
      cpu_cores: cpuCores,
      cpu_speed_ghz: cpuSpeedGhz,
      total_memory_gb: totalMemoryGb,
      os_platform: osPlatform,
      os_version: osVersion,
      hostname: hostname
    });
  } catch (error) {
    console.error('❌ Error collecting system information:', error);
  }
}

function cleanupIntervals() {
  if (appUsageInterval) {
    clearInterval(appUsageInterval);
    appUsageInterval = null;
  }
  if (idleCheckInterval) {
    clearInterval(idleCheckInterval);
    idleCheckInterval = null;
  }
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout);
    heartbeatTimeout = null;
  }
  if (systemInfoTimeout) {
    clearTimeout(systemInfoTimeout);
    systemInfoTimeout = null;
  }
  if (browserHistoryInterval) {
    clearInterval(browserHistoryInterval);
    browserHistoryInterval = null;
  }
}

function setupAppUsageTracking() {
  // App usage tracking interval
  appUsageInterval = setInterval(async () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return; // Skip if not connected
    }

    console.log('App usage interval running...');
    const result = await activeWin();
    console.log('🔍 Active window result:', result);
    if (!result) return;

    const appName = result.owner.name;
    const processId = result.owner.processId;
    const memoryUsage = result.memoryUsage; // in bytes
    const windowTitle = result.title || '';
    const windowUrl = result.url || '';

    // Debug: Log what we're getting from active-win
    console.log('🔍 Extracted data:', {
      appName,
      windowTitle,
      windowUrl,
      hasUrl: !!windowUrl,
      hasTitle: !!windowTitle
    });

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

    // Enhanced browser tracking
    let browserData = null;
    if (isBrowserApp(appName)) {
      console.log('🔍 Browser detected:', appName);
      console.log('🔍 Window title:', windowTitle);
      console.log('🔍 Window URL:', windowUrl);

      browserData = extractBrowserData(appName, windowTitle, windowUrl);
      console.log('🔍 Extracted browser data:', browserData);

      // Blacklist specific patterns that should not be logged
      const blacklistPatterns = [
        /^New tab(?: - (?:Personal|Work|Default|Profile \d+))?$/i,
        /^New tab and \d+ more pages? - (?:Personal|Work|Default|Profile \d+)$/i,
        /^New private tab$/i,
        /^New tab - \[InPrivate\]$/i,
        /^New (?:Incognito|InPrivate) window$/i,
        /^Start page$/i,
        /^Home$/i
      ];

      const isBlacklisted = browserData.searchQuery &&
        blacklistPatterns.some(pattern => pattern.test(browserData.searchQuery.trim()));

      // Only log if we have a valid search query and it's not blacklisted
      const hasValidSearchQuery = browserData.searchQuery &&
        browserData.searchQuery.trim().length > 0 &&
        !isBlacklisted;

      const hasValidUrl = windowUrl && windowUrl.trim().length > 0 && !windowUrl.includes('newtab');

      const activityKey = `${appName}::${browserData.searchQuery || ''}::${windowUrl || ''}`;

      if ((hasValidSearchQuery || hasValidUrl) && activityKey !== lastBrowserActivityKey) {
        // Send browser activity data only if we have meaningful data AND the URL changed
        sendMessage({
          type: 'browser_activity',
          pc_name: pcName,
          browser: appName,
          url: windowUrl || '',
          search_query: browserData.searchQuery || '',
          search_engine: browserData.searchEngine,
          timestamp: now.toISOString()
        });
        console.log('🔍 Sent browser activity to server (URL changed):', {
          query: browserData.searchQuery,
          engine: browserData.searchEngine,
          url: windowUrl
        });

        // Update last activity signature
        lastBrowserActivityKey = activityKey;
      } else if (activityKey === lastBrowserActivityKey) {
        console.log('🔍 Skipping browser activity - no change in URL/title signature');
      } else {
        console.log('🔍 Skipping browser activity - blacklisted or no valid data:', browserData.searchQuery);
      }
    }

    // Get GPU usage and send the log inside the callback
    getSystemGpuUsage((gpuPercent) => {
      // NOTE: We DO NOT update lastActivityTime here anymore because active-win
      // returns data even if the user is idle. We rely on checkSystemIdleTime() instead.

      if (!appActive) {
        // First non-ignored app seen
        sendMessage({
          type: 'app_usage_start',
          pc_name: pcName,
          app_name: appName,
          start_time: now.toISOString(),
          end_time: now.toISOString(),
          duration_seconds: 0,
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
        });
        console.log('Sent app_usage_start for', appName);
        lastApp = appName;
        lastStart = now;
        appActive = true;
      } else if (appName !== lastApp) {
        // App changed: finalize previous, start new
        sendMessage({
          type: 'app_usage_end',
          pc_name: pcName,
          app_name: lastApp,
          start_time: lastStart.toISOString(),
          end_time: now.toISOString(),
          duration_seconds: Math.floor((now - lastStart) / 1000),
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
        });
        console.log('Sent app_usage_end for', lastApp);

        sendMessage({
          type: 'app_usage_start',
          pc_name: pcName,
          app_name: appName,
          start_time: now.toISOString(),
          end_time: now.toISOString(),
          duration_seconds: 0,
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
        });
        console.log('Sent app_usage_start for', appName);

        lastApp = appName;
        lastStart = now;
      } else {
        // App is still active, update
        sendMessage({
          type: 'app_usage_update',
          pc_name: pcName,
          app_name: appName,
          start_time: lastStart.toISOString(),
          end_time: now.toISOString(),
          duration_seconds: Math.floor((now - lastStart) / 1000),
          memory_usage_bytes: memoryUsage,
          cpu_percent: cpuPercent,
          gpu_percent: gpuPercent
        });
        console.log('Sent app_usage_update for', appName);
      }
    });
  }, 3000); // 3 seconds
}

function checkSystemIdleTime() {
  const psScript = path.join(__dirname, 'check-idle.ps1');
  const command = `powershell -ExecutionPolicy Bypass -File "${psScript}"`;

  console.log('Checking idle time with command:', command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error checking idle time:', error);
      return;
    }

    const trimmedOutput = stdout.trim();
    console.log('Idle check output:', trimmedOutput);

    const idleMillis = parseInt(trimmedOutput, 10);
    if (isNaN(idleMillis)) {
      console.error('Invalid idle time received:', trimmedOutput);
      return;
    }

    const now = new Date();
    const shouldBeIdle = idleMillis >= IDLE_THRESHOLD_MS;

    // Debug log every check if close to threshold or just for visibility
    console.log(`Idle check: ${idleMillis}ms (Threshold: ${IDLE_THRESHOLD_MS}ms) -> Idle: ${shouldBeIdle}`);

    // Only send update if idle state changed
    if (shouldBeIdle !== isIdle) {
      isIdle = shouldBeIdle;

      if (isIdle) {
        idleStartTime = now;
        console.log(`💤 System is now idle (Idle time: ${idleMillis}ms)`);
      } else {
        // Transition from Idle -> Active
        const idleEndTime = now;
        // Calculate duration based on the actual idle start time we tracked
        // If we just detected it, use the current time - duration? No, we have idleStartTime.

        let duration = 0;
        if (idleStartTime) {
          duration = Math.floor((idleEndTime - idleStartTime) / 1000);
        }

        // Send idle session data to server
        sendMessage({
          type: 'idle_session',
          pc_name: pcName,
          start_time: idleStartTime ? idleStartTime.toISOString() : now.toISOString(),
          end_time: idleEndTime.toISOString(),
          duration_seconds: duration
        });

        idleStartTime = null;
        console.log(`🏃 Active again after ${duration}s idle`);
      }

      sendMessage({
        type: 'idle_status',
        pc_name: pcName,
        is_idle: isIdle,
        timestamp: now.toISOString()
      });

      // Notify parent process (main.js) for UI update
      if (process.send) {
        process.send({ type: 'idle-status', isIdle: isIdle });
      }
    }
  });
}

function setupIdleDetection() {
  // Check idle time every 5 seconds
  idleCheckInterval = setInterval(checkSystemIdleTime, 5000);
}

function setupHeartbeat() {
  // Clear any existing heartbeat timeout
  if (heartbeatTimeout) {
    clearTimeout(heartbeatTimeout);
  }

  // Send heartbeat messages periodically
  // The WebSocket library will automatically detect connection issues when sending
  heartbeatInterval = setInterval(() => {
    if (!ws) {
      return;
    }

    // Check connection state
    if (ws.readyState !== WebSocket.OPEN) {
      // Connection is not open, cleanup will happen in close handler
      return;
    }

    // Send a lightweight heartbeat message
    // If the connection is dead, this will trigger the error/close handlers
    try {
      sendMessage({
        type: 'heartbeat',
        pc_name: pcName,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // If send fails, the connection is likely dead
      // The error/close handlers will trigger reconnection
      console.log('💔 Heartbeat send error:', error.message);
    }
  }, HEARTBEAT_INTERVAL);
}

function connect() {
  // Clear any existing reconnection timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // Don't reconnect if already connecting/connected
  if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
    return;
  }

  // Don't reconnect if we're already reconnecting
  if (isReconnecting) {
    return;
  }

  console.log(`🔌 Attempting to connect to ${wsUrl}...`);

  try {
    ws = new WebSocket(wsUrl);
    isReconnecting = false;

    ws.on('open', async () => {
      console.log('✅ WebSocket connected to', wsUrl);
      reconnectAttempts = 0; // Reset on successful connection

      // Send start message
      sendMessage({ type: 'start', pc_name: pcName });
      console.log('Session started');

      // Setup all tracking intervals
      setupAppUsageTracking();
      setupIdleDetection();
      setupHeartbeat();
      setupBrowserHistoryTracking();

      // Send buffered messages first (if any)
      await sendBufferedMessages();

      // Send system information after a short delay
      systemInfoTimeout = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          sendSystemInfo();
        }
      }, 1000);
    });

    ws.on('error', (err) => {
      console.error('❌ WebSocket error:', err.message);
      // Don't log connection refused errors repeatedly
      if (!err.message.includes('ECONNREFUSED')) {
        console.error('Failed to connect to:', wsUrl);
        console.error('Please check:');
        console.error('1. Server is running on the correct IP and port');
        console.error('2. Firewall allows connections on port 8080');
        console.error('3. Config file has the correct server IP');
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed (code: ${code}, reason: ${reason || 'none'})`);

      // Cleanup intervals
      cleanupIntervals();

      // Attempt to reconnect (unless we're shutting down)
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;

        // Exponential backoff with jitter
        const baseDelay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY);
        const jitter = Math.random() * 1000; // Add up to 1 second of jitter
        const delay = baseDelay + jitter;

        console.log(`🔄 Reconnecting in ${Math.round(delay / 1000)} seconds (attempt ${reconnectAttempts})...`);
        isReconnecting = true;

        reconnectTimeout = setTimeout(() => {
          isReconnecting = false;
          connect();
        }, delay);
      } else {
        console.error('❌ Max reconnection attempts reached. Stopping reconnection attempts.');
      }
    });

    ws.on('message', (data) => {
      // Handle any messages from server if needed
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message from server:', message);
        // Handle server messages here if needed
      } catch (error) {
        // Ignore non-JSON messages or ping/pong frames
      }
    });

  } catch (error) {
    console.error('❌ Error creating WebSocket connection:', error);
    // Schedule reconnection
    const delay = Math.min(INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
    reconnectTimeout = setTimeout(() => {
      connect();
    }, delay);
  }
}

// Listen for shutdown/logoff signals
function handleExit() {
  console.log('🛑 Shutting down...');

  // Clear reconnection timeout
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
  }

  // Cleanup intervals
  cleanupIntervals();

  // Send stop message if connected
  if (ws && ws.readyState === WebSocket.OPEN) {
    sendMessage({ type: 'stop', pc_name: pcName });
    // Give it a moment to send, then close
    setTimeout(() => {
      ws.close();
      process.exit(0);
    }, 500);
  } else {
    process.exit(0);
  }
}

// Handle shutdown and exit signals
process.on('SIGINT', handleExit);   // Ctrl+C
process.on('SIGTERM', handleExit);  // Termination
process.on('SIGHUP', handleExit);   // Terminal closed

// Check for existing buffer file on startup
const startupBuffer = readBuffer();
if (startupBuffer.messages && startupBuffer.messages.length > 0) {
  console.log(`📦 Found ${startupBuffer.messages.length} buffered messages from previous session`);
  console.log(`   Last updated: ${startupBuffer.lastUpdated || 'Unknown'}`);
  console.log(`   These will be sent when connection is established`);
}

// Initial connection
connect();

// Keep the process alive
setInterval(() => { }, 1000);
