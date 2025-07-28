const fs = require('fs');
const path = require('path');

class Config {
  constructor() {
    const basePath = process.resourcesPath || __dirname;
    this.configPath = path.join(basePath, 'config.json');
    this.defaultConfig = {
      serverIP: '127.0.0.1',
      serverPort: 8080
    };

    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
      } catch (err) {
        console.error('Error reading config.json:', err);
        this.config = this.defaultConfig;
      }
    } else {
      console.warn('No config.json found, using default settings.');
      this.config = this.defaultConfig;
    }
  }

  getWebSocketURL() {
    return `ws://${this.config.serverIP}:${this.config.serverPort}`;
  }
}

module.exports = new Config();