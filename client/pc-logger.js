const WebSocket = require('ws');
const os = require('os');
const activeWin = require('active-win');
const pidusage = require('pidusage');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const si = require('systeminformation');

const config = require('./config');
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
const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

// Interval references (for cleanup)
let appUsageInterval = null;
let idleCheckInterval = null;
let heartbeatInterval = null;
let heartbeatTimeout = null;
let systemInfoTimeout = null;

const IGNORED_APPS = [
  // Add more as needed
];

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
      
      // Browser-specific patterns
      /^(.+?) - Chrome$/,
      /^(.+?) - Firefox$/,
      /^(.+?) - Edge$/,
      /^(.+?) - Brave$/
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
  
  // Final fallback: If we have a browser but no search query, still log the activity
  if (!searchQuery && appName) {
    console.log('🔍 Browser activity without search query detected');
    
    // Try to extract search query from window title even if it doesn't match our patterns
    if (windowTitle && windowTitle.length > 5) {
      // If title looks like it might contain a search query, use it
      const suspiciousTitles = ['search', 'google', 'bing', 'yahoo', 'duckduckgo', 'youtube'];
      if (suspiciousTitles.some(sus => windowTitle.toLowerCase().includes(sus))) {
        searchQuery = windowTitle; // Use the full title as search query
        searchEngine = 'Unknown';
        console.log('🔍 Using full title as search query:', searchQuery);
      }
    }
  }
  
  const result = {
    searchQuery,
    searchEngine,
    isSearchPage: !!searchQuery
  };
  
  console.log('🔍 Final extraction result:', result);
  return result;
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
      
      // Merge window title and search query into one field
      let finalSearchQuery = browserData.searchQuery || windowTitle || '';
      
      // Send browser activity data immediately (even if no search query)
      sendMessage({
        type: 'browser_activity',
        pc_name: pcName,
        browser: appName,
        url: windowUrl,
        search_query: finalSearchQuery,
        search_engine: browserData.searchEngine,
        timestamp: now.toISOString()
      });
      console.log('🔍 Sent browser activity to server');
    }

    // Get GPU usage and send the log inside the callback
    getSystemGpuUsage((gpuPercent) => {
      // Update last activity time whenever there's app activity
      lastActivityTime = now;
      
      // If was idle, mark as active now
      if (isIdle) {
        isIdle = false;
        sendMessage({
          type: 'idle_status',
          pc_name: pcName,
          is_idle: false,
          timestamp: now.toISOString()
        });
      }

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

function setupIdleDetection() {
  // Idle detection interval
  idleCheckInterval = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return; // Skip if not connected
    }

    const now = new Date();
    const timeSinceLastActivity = now - lastActivityTime;
    const shouldBeIdle = timeSinceLastActivity >= IDLE_THRESHOLD_MS;

    // Only send update if idle state changed
    if (shouldBeIdle !== isIdle) {
      isIdle = shouldBeIdle;
      sendMessage({
        type: 'idle_status',
        pc_name: pcName,
        is_idle: isIdle,
        timestamp: now.toISOString()
      });
    }
  }, 30000); // Check every 30 seconds
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
setInterval(() => {}, 1000);
