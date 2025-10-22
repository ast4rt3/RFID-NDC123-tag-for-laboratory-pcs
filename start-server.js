#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting RFID Monitoring Server...');
console.log('📋 Configuration:');
console.log('   - Database: Local SQLite (no XAMPP required)');
console.log('   - WebSocket: Port 8080 (accepts connections from any IP)');
console.log('   - HTTP API: Port 3000 (accepts connections from any IP)');
console.log('   - Auto-fallback: Will use Supabase if configured');
console.log('');

// Start the server
const serverProcess = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  cwd: __dirname
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


