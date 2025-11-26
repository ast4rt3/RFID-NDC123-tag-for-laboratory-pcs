const path = require('path');
const fs = require('fs');

function getResourcesRoot() {
  const defaultPath = path.join(__dirname, '..', '..');

  if (!process || !process.resourcesPath) {
    return defaultPath;
  }

  let root = process.resourcesPath;

  if (!fs.existsSync(path.join(root, 'LibreHardwareMonitor'))) {
    if (root.endsWith('app.asar.unpacked')) {
      const candidate = path.resolve(root, '..', 'resources');
      if (fs.existsSync(path.join(candidate, 'LibreHardwareMonitor'))) {
        root = candidate;
      }
    } else if (root.endsWith('app.asar')) {
      const candidate = path.resolve(root, '..');
      if (fs.existsSync(path.join(candidate, 'LibreHardwareMonitor'))) {
        root = candidate;
      }
    } else {
      const candidate = path.join(root, 'resources');
      if (fs.existsSync(path.join(candidate, 'LibreHardwareMonitor'))) {
        root = candidate;
      }
    }
  }

  return root;
}

module.exports = { getResourcesRoot };

