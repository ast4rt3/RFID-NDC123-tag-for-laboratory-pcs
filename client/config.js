const fs = require('fs');
const path = require('path');

class Config {
  constructor() {
    this.defaultConfig = {
      serverIP: '127.0.0.1',
      serverPort: 8080
    };

    // Determine possible config locations for both dev and packaged builds
    const possiblePaths = [];

    // 1) Packaged: alongside resources (where main writes it)
    if (process.resourcesPath) {
      possiblePaths.push(path.join(path.dirname(process.resourcesPath), 'config.json'));
      // 2) Packaged (legacy): app.asar.unpacked/client/config.json
      possiblePaths.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'client', 'config.json'));
    }

    // 3) Development: local client directory
    possiblePaths.push(path.join(__dirname, 'config.json'));

    // Pick the first existing config file
    this.configPath = possiblePaths.find(p => {
      try {
        return fs.existsSync(p);
      } catch (_) {
        return false;
      }
    }) || possiblePaths[0];

    console.log('Reading config from:', this.configPath);

    if (this.configPath && fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
        console.log('Loaded config:', this.config);
      } catch (err) {
        console.error('Failed to parse config.json, using default:', err);
        this.config = this.defaultConfig;
      }
    } else {
      console.warn('No config.json found, using default config.');
      this.config = this.defaultConfig;
    }
  }

  getWebSocketURL() {
    return `ws://${this.config.serverIP}:${this.config.serverPort}`;
  }

  getApiURL() {
    return `http://${this.config.serverIP}:3000`;
  }
}

module.exports = new Config();