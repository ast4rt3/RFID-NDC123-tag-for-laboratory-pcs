const path = require('path');
const fs = require('fs');

function getResourcesRoot() {
  const defaultPath = path.join(__dirname, '..', '..');
  const possiblePaths = [];

  // 1. Check process.resourcesPath (Production / Electron default)
  if (process.resourcesPath) {
    possiblePaths.push(process.resourcesPath);
  }

  // 2. Check local resources folder (Development)
  possiblePaths.push(path.join(defaultPath, 'resources'));

  // 3. Check relative to main module (Fallback)
  if (process.mainModule && process.mainModule.filename) {
    possiblePaths.push(path.join(path.dirname(process.mainModule.filename), '..', 'resources'));
  }

  for (const root of possiblePaths) {
    const lhmPath = path.join(root, 'LibreHardwareMonitor', 'LibreHardwareMonitor.exe');
    if (fs.existsSync(lhmPath)) {
      return root;
    }
  }

  // Default to process.resourcesPath if available, otherwise defaultPath
  return process.resourcesPath || defaultPath;
}

module.exports = { getResourcesRoot };

