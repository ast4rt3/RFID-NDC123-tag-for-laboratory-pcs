#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🚀 RFID Server Installer');
console.log('========================');

class ServerInstaller {
  constructor() {
    this.installDir = path.join(os.homedir(), 'RFID-Server');
    this.serviceName = 'RFID-Server';
  }

  async install() {
    try {
      console.log('📁 Creating installation directory...');
      await this.createInstallDirectory();
      
      console.log('📋 Copying server files...');
      await this.copyServerFiles();
      
      console.log('⚙️  Installing dependencies...');
      await this.installDependencies();
      
      console.log('🔧 Creating configuration files...');
      await this.createConfigFiles();
      
      console.log('🎯 Creating startup script...');
      await this.createStartupScript();
      
      console.log('🖥️  Installing as Windows Service...');
      await this.installService();
      
      console.log('✅ Installation completed successfully!');
      console.log('');
      console.log('📋 Server Information:');
      console.log(`   📁 Installation: ${this.installDir}`);
      console.log(`   🌐 WebSocket: ws://0.0.0.0:8080`);
      console.log(`   🔗 HTTP API: http://0.0.0.0:3000`);
      console.log(`   📊 Dashboard: http://localhost:3000/dashboard`);
      console.log('');
      console.log('🎮 Management Commands:');
      console.log(`   Start: net start ${this.serviceName}`);
      console.log(`   Stop: net stop ${this.serviceName}`);
      console.log(`   Status: sc query ${this.serviceName}`);
      
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  }

  async createInstallDirectory() {
    if (!fs.existsSync(this.installDir)) {
      fs.mkdirSync(this.installDir, { recursive: true });
    }
  }

  async copyServerFiles() {
    const filesToCopy = [
      'server/server.js',
      'server/database.js',
      'server/supabase-client.js',
      'package.json',
      'package-lock.json'
    ];

    for (const file of filesToCopy) {
      if (fs.existsSync(file)) {
        const destPath = path.join(this.installDir, path.basename(file));
        fs.copyFileSync(file, destPath);
        console.log(`   ✅ Copied ${file}`);
      }
    }
  }

  async installDependencies() {
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install', '--production'], {
        cwd: this.installDir,
        stdio: 'inherit'
      });

      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }

  async createConfigFiles() {
    // Create .env file
    const envContent = `# RFID Server Configuration
DB_TYPE=supabase
PORT=3000
WS_PORT=8080

# Supabase Configuration (Update with your credentials)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Server Settings
NODE_ENV=production
`;

    fs.writeFileSync(path.join(this.installDir, '.env'), envContent);

    // Create server-config.json
    const configContent = {
      server: {
        name: "RFID Monitoring Server",
        version: "1.0.0",
        description: "RFID Laboratory PC Monitoring Server",
        ports: {
          http: 3000,
          websocket: 8080
        }
      },
      database: {
        type: "supabase",
        fallback: "memory"
      },
      logging: {
        level: "info",
        file: "server.log"
      }
    };

    fs.writeFileSync(
      path.join(this.installDir, 'server-config.json'),
      JSON.stringify(configContent, null, 2)
    );
  }

  async createStartupScript() {
    const startScript = `@echo off
echo Starting RFID Server...
cd /d "${this.installDir}"
node server.js
pause`;

    const stopScript = `@echo off
echo Stopping RFID Server...
taskkill /f /im node.exe /fi "WINDOWTITLE eq RFID Server*"
echo Server stopped.
pause`;

    fs.writeFileSync(path.join(this.installDir, 'start-server.bat'), startScript);
    fs.writeFileSync(path.join(this.installDir, 'stop-server.bat'), stopScript);
  }

  async installService() {
    // Create Windows service using node-windows (if available)
    const serviceScript = `
const Service = require('node-windows').Service;
const path = require('path');

const svc = new Service({
  name: '${this.serviceName}',
  description: 'RFID Laboratory PC Monitoring Server',
  script: path.join('${this.installDir}', 'server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function() {
  console.log('Service installed successfully');
  svc.start();
});

svc.on('start', function() {
  console.log('Service started');
});

svc.install();
`;

    fs.writeFileSync(path.join(this.installDir, 'install-service.js'), serviceScript);
    
    console.log('   📝 Service script created');
    console.log('   ⚠️  To install as service, run: node install-service.js');
  }
}

// Run installer
if (require.main === module) {
  const installer = new ServerInstaller();
  installer.install();
}

module.exports = ServerInstaller;