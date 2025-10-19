const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Serve static files from dist directory
app.use('/updates', express.static(path.join(__dirname, 'dist')));

// Serve the latest.yml file for auto-updater
app.get('/updates/latest.yml', (req, res) => {
  const latestYmlPath = path.join(__dirname, 'dist', 'latest.yml');
  
  if (fs.existsSync(latestYmlPath)) {
    res.sendFile(latestYmlPath);
  } else {
    res.status(404).send('latest.yml not found');
  }
});

// Serve the latest.yml file at root for compatibility
app.get('/latest.yml', (req, res) => {
  const latestYmlPath = path.join(__dirname, 'dist', 'latest.yml');
  
  if (fs.existsSync(latestYmlPath)) {
    res.sendFile(latestYmlPath);
  } else {
    res.status(404).send('latest.yml not found');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RFID Monitor Update Server is running',
    timestamp: new Date().toISOString()
  });
});

// API endpoint to check for updates
app.get('/api/check-update/:version', (req, res) => {
  const currentVersion = req.params.version;
  
  try {
    // Read the latest.yml file to get the latest version
    const latestYmlPath = path.join(__dirname, 'dist', 'latest.yml');
    
    if (!fs.existsSync(latestYmlPath)) {
      return res.json({
        updateAvailable: false,
        message: 'No update information available'
      });
    }
    
    const latestYml = fs.readFileSync(latestYmlPath, 'utf8');
    
    // Extract version from latest.yml (simplified parsing)
    const versionMatch = latestYml.match(/version:\s*([0-9.]+)/);
    const latestVersion = versionMatch ? versionMatch[1] : null;
    
    if (!latestVersion) {
      return res.json({
        updateAvailable: false,
        message: 'Could not parse version information'
      });
    }
    
    // Simple version comparison (you might want to use a proper semver library)
    const isUpdateAvailable = compareVersions(latestVersion, currentVersion) > 0;
    
    res.json({
      updateAvailable: isUpdateAvailable,
      currentVersion: currentVersion,
      latestVersion: latestVersion,
      downloadUrl: isUpdateAvailable ? `/updates/RFID NDC123 Client Setup ${latestVersion}.exe` : null
    });
    
  } catch (error) {
    console.error('Error checking for updates:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Simple version comparison function
function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part > v2part) return 1;
    if (v1part < v2part) return -1;
  }
  
  return 0;
}

// Get server IP address
function getServerIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
const serverIP = getServerIP();

app.listen(PORT, () => {
  console.log('🚀 RFID Monitor Update Server Started');
  console.log('=====================================');
  console.log(`📡 Server running on: http://${serverIP}:${PORT}`);
  console.log(`📁 Updates served from: /updates`);
  console.log(`📋 Health check: http://${serverIP}:${PORT}/health`);
  console.log(`🔍 Update API: http://${serverIP}:${PORT}/api/check-update/VERSION`);
  console.log('');
  console.log('📦 To publish updates:');
  console.log('1. Build your application: npm run build-installer');
  console.log('2. Copy files to dist/ directory');
  console.log('3. Update latest.yml with new version');
  console.log('');
  console.log('🔄 Clients will automatically check for updates from this server');
});
