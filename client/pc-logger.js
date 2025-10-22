const WebSocket = require('ws');
const os = require('os');
const activeWin = require('active-win'); // <--- Add this
const pidusage = require('pidusage');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
// const sqlite3 = require('sqlite3').verbose(); // Temporarily disabled


const config = require('./config');
const TemperatureMonitor = require('./temperature-monitor');
const OverclockingDetector = require('./overclocking-detector');
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

// Initialize monitoring modules
const temperatureMonitor = new TemperatureMonitor();
const overclockingDetector = new OverclockingDetector();

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
  console.log("Connecting to WebSocket at:", wsUrl);

  setInterval(async () => {
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
      ws.send(JSON.stringify({
        type: 'browser_activity',
        pc_name: pcName,
        browser: appName,
        url: windowUrl,
        search_query: finalSearchQuery,
        search_engine: browserData.searchEngine,
        timestamp: toPhilippineTimeString(now)
      }));
      console.log('🔍 Sent browser activity to server');
    }

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
        // Get temperature and overclocking data
        (async () => {
          const temperatures = await temperatureMonitor.getAllTemperatures();
          console.log(temperatures);
        })();
        (async () => {
          try {
            const temperatures = await temperatureMonitor.getAllTemperatures();
            const overclockingData = await overclockingDetector.detectAllOverclocking();
        
            ws.send(JSON.stringify({
              type: 'app_usage_update',
              pc_name: pcName,
              app_name: appName,
              start_time: toPhilippineTimeString(lastStart),
              end_time: toPhilippineTimeString(now),
              duration_seconds: Math.floor((now - lastStart) / 1000),
              memory_usage_bytes: memoryUsage,
              cpu_percent: cpuPercent,
              cpu_temperature: temperatures.cpu,
              is_cpu_overclocked: overclockingData.cpu.isOverclocked,
              is_ram_overclocked: overclockingData.ram.isOverclocked
            }));
        
            console.log('Sent app_usage_update for', appName);
          } catch (err) {
            console.error('Error during app_usage_update:', err);
          }
        })();
        
        console.log('Sent app_usage_update for', appName);
      }
    });
  }, 3000); // 3 seconds
  // --- End app usage tracking ---

  // --- Temperature monitoring (every 30 seconds) ---
  setInterval(async () => {
    try {
      const temperatures = await temperatureMonitor.getAllTemperatures();
      
      // Check for critical temperatures
      const isCritical = temperatures.cpu && temperatureMonitor.isTemperatureCritical(temperatures.cpu, 'cpu') ||
                         temperatures.gpu && temperatureMonitor.isTemperatureCritical(temperatures.gpu, 'gpu') ||
                         temperatures.system && temperatureMonitor.isTemperatureCritical(temperatures.system, 'system');
      
      // Send temperature data
      ws.send(JSON.stringify({
        type: 'temperature_log',
        pc_name: pcName,
        cpu_temperature: temperatures.cpu,
        gpu_temperature: temperatures.gpu,
        motherboard_temperature: temperatures.system,
        ambient_temperature: temperatures.ambient,
        is_critical: isCritical,
        timestamp: new Date().toISOString()
      }));
      
      console.log('Temperature data sent:', temperatures);
    } catch (error) {
      console.error('Error collecting temperature data:', error);
    }
  }, 30000); // 30 seconds
  // --- End temperature monitoring ---

  // --- Overclocking detection (every 60 seconds) ---
  setInterval(async () => {
    try {
      const overclockingData = await overclockingDetector.detectAllOverclocking();
      
      // Send overclocking alerts if detected
      if (overclockingData.cpu.isOverclocked) {
        const alert = overclockingDetector.generateAlert(
          pcName, 
          'CPU', 
          overclockingData.cpu, 
          overclockingDetector.calculateTemperatureImpact(overclockingData.cpu.overclockPercent, await temperatureMonitor.getCPUTemperature())
        );
        
        ws.send(JSON.stringify({
          type: 'overclocking_alert',
          ...alert
        }));
        
        console.log('CPU overclocking detected:', overclockingData.cpu);
      }
      
      if (overclockingData.ram.isOverclocked) {
        const alert = overclockingDetector.generateAlert(
          pcName, 
          'RAM', 
          overclockingData.ram, 
          overclockingDetector.calculateTemperatureImpact(overclockingData.ram.overclockPercent, await temperatureMonitor.getSystemTemperature())
        );
        
        ws.send(JSON.stringify({
          type: 'overclocking_alert',
          ...alert
        }));
        
        console.log('RAM overclocking detected:', overclockingData.ram);
      }
      
      // Send system metrics
      const temperatures = await temperatureMonitor.getAllTemperatures();
      ws.send(JSON.stringify({
        type: 'system_metrics',
        pc_name: pcName,
        cpu_usage_percent: 0, // Will be filled by server
        memory_usage_percent: 0, // Will be filled by server
        cpu_temperature: temperatures.cpu,
        gpu_temperature: temperatures.gpu,
        cpu_frequency: overclockingData.cpu.currentFreq,
        memory_frequency: overclockingData.ram.currentFreq,
        is_cpu_overclocked: overclockingData.cpu.isOverclocked,
        is_ram_overclocked: overclockingData.ram.isOverclocked,
        is_gpu_overclocked: false, // GPU tracking removed
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error detecting overclocking:', error);
    }
  }, 60000); // 60 seconds
  // --- End overclocking detection ---

  // --- Browser history collection (every 5 minutes) ---
  setInterval(async () => {
    try {
      console.log('Collecting browser history...');
      // Browser history collection temporarily disabled
      // const historyEntries = await collectBrowserHistory();
      
      // Browser history processing temporarily disabled
      // if (historyEntries.length > 0) {
      //   console.log(`Found ${historyEntries.length} search entries in browser history`);
      //   
      //   // Send each history entry to server
      //   for (const entry of historyEntries) {
      //     ws.send(JSON.stringify({
      //       type: 'browser_history',
      //       pc_name: pcName,
      //       browser: entry.browser,
      //       window_title: entry.title,
      //       url: entry.url,
      //       search_query: entry.searchQuery,
      //       search_engine: entry.searchEngine,
      //       timestamp: entry.timestamp
      //     }));
      //   }
      //   console.log(`Sent ${historyEntries.length} browser history entries`);
      // } else {
      //   console.log('No recent search entries found in browser history');
      // }
    } catch (error) {
      console.error('Error collecting browser history:', error);
    }
  }, 300000); // 5 minutes (300000 ms)
  // --- End browser history collection ---
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

// Browser history database access functions
// Browser history functions temporarily disabled
// function getBrowserHistoryPaths() {
//   const homeDir = os.homedir();
//   const browserPaths = {
//     chrome: [
//       path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'History'),
//       path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Profile 1', 'History')
//     ],
//     edge: [
//       path.join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'History'),
//       path.join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Profile 1', 'History')
//     ],
//     firefox: [
//       path.join(homeDir, 'AppData', 'Roaming', 'Mozilla', 'Firefox', 'Profiles')
//     ]
//   };
//   
//   const availablePaths = {};
//   
//   // Check Chrome/Edge paths
//   for (const [browser, paths] of Object.entries(browserPaths)) {
//     if (browser === 'firefox') continue; // Handle Firefox separately
//     
//     for (const dbPath of paths) {
//       if (fs.existsSync(dbPath)) {
//         if (!availablePaths[browser]) availablePaths[browser] = [];
//         availablePaths[browser].push(dbPath);
//       }
//     }
//   }
//   
//   // Check Firefox paths
//   if (fs.existsSync(browserPaths.firefox[0])) {
//     const firefoxProfiles = fs.readdirSync(browserPaths.firefox[0])
//       .filter(dir => dir.endsWith('.default-release') || dir.endsWith('.default'))
//       .map(dir => path.join(browserPaths.firefox[0], dir, 'places.sqlite'));
//     
//     availablePaths.firefox = firefoxProfiles.filter(dbPath => fs.existsSync(dbPath));
//   }
//   
//   return availablePaths;
// }

// function extractSearchFromHistory(browser, dbPath, limit = 50) {
//   return new Promise((resolve) => {
//     const searchEntries = [];
//     
//     try {
//       const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
//       
//       if (browser === 'chrome' || browser === 'edge') {
//         // Chrome/Edge SQLite query
//         const query = `
//           SELECT url, title, last_visit_time 
//           FROM urls 
//           WHERE (url LIKE '%google.com/search%' OR 
//                  url LIKE '%bing.com/search%' OR 
//                  url LIKE '%yahoo.com/search%' OR 
//                  url LIKE '%duckduckgo.com/%' OR 
//                  url LIKE '%youtube.com/results%') 
//           AND last_visit_time > ${Date.now() * 1000 - (24 * 60 * 60 * 1000)} -- Last 24 hours
//           ORDER BY last_visit_time DESC 
//           LIMIT ?
//         `;
//         
//         db.all(query, [limit], (err, rows) => {
//           if (err) {
//             console.error(`Error reading ${browser} history:`, err);
//             resolve([]);
//             return;
//           }
//           
//           rows.forEach(row => {
//             const searchData = extractSearchFromURL(row.url);
//             if (searchData.searchQuery) {
//               searchEntries.push({
//                 browser: browser,
//                 searchQuery: searchData.searchQuery,
//                 searchEngine: searchData.searchEngine,
//                 url: row.url,
//                 title: row.title,
//                 timestamp: new Date((row.last_visit_time / 1000) - 11644473600).toISOString() // Convert Chrome timestamp
//               });
//             }
//           });
//           
//           db.close();
//           resolve(searchEntries);
//         });
//         
//       } else if (browser === 'firefox') {
//         // Firefox SQLite query
//         const query = `
//           SELECT url, title, last_visit_date 
//           FROM moz_places 
//           WHERE (url LIKE '%google.com/search%' OR 
//                  url LIKE '%bing.com/search%' OR 
//                  url LIKE '%yahoo.com/search%' OR 
//                  url LIKE '%duckduckgo.com/%' OR 
//                  url LIKE '%youtube.com/results%') 
//           AND last_visit_date > ${Date.now() * 1000} -- Last 24 hours in microseconds
//           ORDER BY last_visit_date DESC 
//           LIMIT ?
//         `;
//         
//         db.all(query, [limit], (err, rows) => {
//           if (err) {
//             console.error(`Error reading ${browser} history:`, err);
//             resolve([]);
//             return;
//           }
//           
//           rows.forEach(row => {
//             const searchData = extractSearchFromURL(row.url);
//             if (searchData.searchQuery) {
//               searchEntries.push({
//                 browser: browser,
//                 searchQuery: searchData.searchQuery,
//                 searchEngine: searchData.searchEngine,
//                 url: row.url,
//                 title: row.title,
//                 timestamp: new Date(row.last_visit_date / 1000).toISOString() // Convert Firefox timestamp
//               });
//             }
//           });
//           
//           db.close();
//           resolve(searchEntries);
//         });
//       }
//       
//     } catch (error) {
//       console.error(`Error accessing ${browser} history database:`, error);
//       resolve([]);
//     }
//   });
// }

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

// Browser history collection function temporarily disabled
// async function collectBrowserHistory() {
//   const browserPaths = getBrowserHistoryPaths();
//   const allHistoryEntries = [];
//   
//   console.log('Available browser history paths:', browserPaths);
//   
//   for (const [browser, paths] of Object.entries(browserPaths)) {
//     for (const dbPath of paths) {
//       console.log(`Reading ${browser} history from: ${dbPath}`);
//       const entries = await extractSearchFromHistory(browser, dbPath, 20); // Get last 20 searches per browser
//       allHistoryEntries.push(...entries);
//     }
//   }
//   
//   return allHistoryEntries;
// }

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