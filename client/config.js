const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Config {
  constructor() {
    const userDataPath = app.getPath('userData');
    this.configPath = path.join(userDataPath, 'config.json');
    this.defaultConfig = {
      serverIP: '127.0.0.1',
      serverPort: 8080
    };

    if (fs.existsSync(this.configPath)) {
      try {
        const data = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
      } catch (err) {
        console.error('Failed to parse config.json, using default:', err);
        this.config = this.defaultConfig;
      }
    } else {
      console.warn('No config.json found, writing default.');
      this.config = this.defaultConfig;
      fs.writeFileSync(this.configPath, JSON.stringify(this.defaultConfig, null, 2));
    }
  }

  getWebSocketURL() {
    return `ws://${this.config.serverIP}:${this.config.serverPort}`;
  }
}

module.exports = new Config();
