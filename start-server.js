#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting RFID Monitoring Server...');
console.log('📋 Configuration:');

// Load server-config.env if it exists
const envFile = path.join(__dirname, 'server-config.env');
if (fs.existsSync(envFile)) {
  require('dotenv').config({ path: envFile });
  console.log('   - Config file: server-config.env');
} else if (fs.existsSync(path.join(__dirname, '.env'))) {
  require('dotenv').config();
  console.log('   - Config file: .env');
} else {
  console.log('   - Config file: Using defaults (no config file found)');
}

const dbType = process.env.DB_TYPE || 'memory';
const port = process.env.PORT || 3000;
const wsPort = process.env.WS_PORT || 8080;

console.log(`   - Database: ${dbType}`);
console.log(`   - WebSocket: Port ${wsPort} (accepts connections from any IP)`);
console.log(`   - HTTP API: Port ${port} (accepts connections from any IP)`);
console.log('');

// Start the server
const serverProcess = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  cwd: __dirname,
  env: { ...process.env }
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});
