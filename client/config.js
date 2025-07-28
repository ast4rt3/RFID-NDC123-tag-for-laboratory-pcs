const fs = require('fs');
const path = require('path');

class Config {
    constructor() {
        const basePath = process.resourcesPath || __dirname;
        this.configPath = path.join(basePath, 'config.json');
        this.defaultConfig = {
            serverIP: 'localhost'
        };
    }

    load() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(configData);
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
        return this.defaultConfig;
    }

    getServerIP() {
        const config = this.load();
        return config.serverIP || this.defaultConfig.serverIP;
    }

    getWebSocketURL() {
        const serverIP = this.getServerIP();
        return `ws://${serverIP}:8080`;
    }

    getApiURL() {
        const serverIP = this.getServerIP();
        return `http://${serverIP}:3000`;
    }
}

module.exports = new Config(); 