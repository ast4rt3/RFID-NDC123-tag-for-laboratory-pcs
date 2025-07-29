// Test script to verify config loading
const config = require('./client/config');

console.log('=== Config Test ===');
console.log('Config path:', config.configPath);
console.log('WebSocket URL:', config.getWebSocketURL());
console.log('API URL:', config.getApiURL());
console.log('Loaded config:', config.config);
console.log('==================');