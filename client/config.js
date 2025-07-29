const fs = require('fs');
const path = require('path');

class Config {
  constructor() {
    this.defaultConfig = {
      serverIP: '127.0.0.1',
      serverPort: 8080
    };

    // Always use the asar.unpacked client directory for config.json in production
    let baseDir;
    if (process.resourcesPath) {
      baseDir = path.join(process.resourcesPath, 'app.asar.unpacked', 'client');
    } else {
      // For development, use the local client directory
      baseDir = __dirname;
    }
    this.configPath = path.join(baseDir, 'config.json');

    console.log('Reading config from:', this.configPath);

    if (fs.existsSync(this.configPath)) {
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
