const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Helper to format date in 12-hour format with AM/PM
function to12HourFormat(date) {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${strTime}`;
}

// Database abstraction layer that supports both local SQLite and Supabase
class Database {

  // Get all PC statuses
  async getAllPCStatus() {
    if (this.type === 'supabase') {
      return await this.db.getAllPCStatus();
    } else if (this.db && this.db.all) {
      // SQLite
      return new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM pc_status', [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    } else {
      // In-memory fallback
      return Promise.resolve(Object.values(this.db.pcStatus || {}));
    }
  }
  constructor() {
    // Auto-detect database type: check if Supabase credentials exist
    if (process.env.DB_TYPE === 'supabase') {
      this.type = 'supabase';
    } else if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      // Auto-detect: Supabase credentials found, use Supabase
      this.type = 'supabase';
      console.log('🔍 Auto-detected Supabase credentials, using Supabase database');
    } else {
      // No Supabase credentials, use in-memory storage
      this.type = 'memory';
      console.warn('⚠️ No database configured. Using in-memory storage (data will be lost on restart).');
      console.warn('   To use Supabase, set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
    }
    this.db = null;
    this.init();
  }

  async upsertSystemInfo(pcName, cpuModel, cpuCores, cpuSpeedGhz, totalMemoryGb, osPlatform, osVersion, hostname) {
    if (this.type === 'supabase') {
      return await this.db.upsertSystemInfo(pcName, cpuModel, cpuCores, cpuSpeedGhz, totalMemoryGb, osPlatform, osVersion, hostname);
    } else if (this.db && this.db.exec) {
      // SQLite
      return new Promise((resolve, reject) => {
        const sql = `INSERT INTO system_info (pc_name, cpu_model, cpu_cores, cpu_speed_ghz, total_memory_gb, os_platform, os_version, hostname, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(pc_name) DO UPDATE SET 
            cpu_model=excluded.cpu_model,
            cpu_cores=excluded.cpu_cores,
            cpu_speed_ghz=excluded.cpu_speed_ghz,
            total_memory_gb=excluded.total_memory_gb,
            os_platform=excluded.os_platform,
            os_version=excluded.os_version,
            hostname=excluded.hostname,
            updated_at=CURRENT_TIMESTAMP`;
        this.db.run(sql, [pcName, cpuModel, cpuCores, cpuSpeedGhz, totalMemoryGb, osPlatform, osVersion, hostname], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    } else {
      // In-memory storage
      if (!this.db.systemInfo) this.db.systemInfo = {};
      this.db.systemInfo[pcName] = {
        pc_name: pcName,
        cpu_model: cpuModel,
        cpu_cores: cpuCores,
        cpu_speed_ghz: cpuSpeedGhz,
        total_memory_gb: totalMemoryGb,
        os_platform: osPlatform,
        os_version: osVersion,
        hostname: hostname,
        updated_at: new Date().toISOString()
      };
      return Promise.resolve();
    }
  }


  async init() {
    if (this.type === 'supabase') {
      try {
        const SupabaseDB = require('./supabase-client');
        this.db = new SupabaseDB();
        const connected = await this.db.testConnection();
        if (!connected) {
          console.warn('⚠️ Supabase connection failed, falling back to memory storage');
          this.type = 'memory';
          this.init();
          return;
        }
        console.log('✅ Supabase database initialized successfully');
        // Using Supabase database
      } catch (error) {
        console.error('❌ Failed to initialize Supabase:', error.message);
        console.warn('⚠️ Falling back to memory storage');
        this.type = 'memory';
        this.init();
        return;
      }
    } else {
      // Use in-memory storage
      this.db = {
        timeLogs: [],
        appUsageLogs: [],
        browserSearchLogs: [],
        idleLogs: [],
        pcStatus: {}  // Initialize pcStatus storage
      };
      console.log('📦 Using in-memory storage (data will not persist)');
    }
  }

  async initLocalTables() {
    return new Promise((resolve, reject) => {
      const createTables = `
        CREATE TABLE IF NOT EXISTS time_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pc_name TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          duration_seconds INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS app_usage_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pc_name TEXT NOT NULL,
          app_name TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          duration_seconds INTEGER NOT NULL,
          memory_usage_bytes INTEGER,
          cpu_percent REAL,
          gpu_percent REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(pc_name, app_name, start_time)
        );

        CREATE TABLE IF NOT EXISTS browser_search_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pc_name TEXT NOT NULL,
          browser TEXT NOT NULL,
          url TEXT,
          search_query TEXT,
          search_engine TEXT,
          timestamp DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(pc_name, browser, url, timestamp)
        );

        CREATE TABLE IF NOT EXISTS pc_status (
          pc_name TEXT PRIMARY KEY,
          is_online BOOLEAN NOT NULL,
          last_seen DATETIME,
          last_activity DATETIME,
          is_idle BOOLEAN DEFAULT 0
        );

        CREATE INDEX IF NOT EXISTS idx_time_logs_pc_name ON time_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_app_usage_logs_pc_name ON app_usage_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_app_usage_logs_start_time ON app_usage_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_browser_search_logs_pc_name ON browser_search_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_browser_search_logs_timestamp ON browser_search_logs(timestamp);

        CREATE TABLE IF NOT EXISTS idle_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pc_name TEXT NOT NULL,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          duration_seconds INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_idle_logs_pc_name ON idle_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_idle_logs_start_time ON idle_logs(start_time);
      `;
  // Helper to format date in 12-hour format with AM/PM

      this.db.exec(createTables, (err) => {
        if (err) {
          console.error('Error creating local tables:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async testConnection() {
    if (this.type === 'supabase') {
      return await this.db.testConnection();
    } else {
      // In-memory storage is always available
      return Promise.resolve(true);
    }
  }

  async insertTimeLog(pcName, startTime, endTime, duration) {
    // Convert to ISO strings to preserve timezone
    const formattedStartTime = new Date(startTime).toISOString();
    const formattedEndTime = new Date(endTime).toISOString();

    if (this.type === 'supabase') {
      return await this.db.insertTimeLog(pcName, formattedStartTime, formattedEndTime, duration);
    } else {
      // In-memory storage
      const log = {
        id: this.db.timeLogs.length + 1,
        pc_name: pcName,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        duration_seconds: duration,
        created_at: new Date().toISOString()
      };
      this.db.timeLogs.push(log);
      // Log saved silently
      return Promise.resolve();
    }
  }

  async insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent) {
    // Convert to ISO strings to preserve timezone
    const formattedStartTime = new Date(startTime).toISOString();
    const formattedEndTime = new Date(endTime).toISOString();

    if (this.type === 'supabase') {
      return await this.db.insertAppUsageLog(pcName, appName, formattedStartTime, formattedEndTime, duration, memoryUsage, cpuPercent, gpuPercent);
    } else {
      // In-memory storage
      const log = {
        id: this.db.appUsageLogs.length + 1,
        pc_name: pcName,
        app_name: appName,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        duration_seconds: duration,
        memory_usage_bytes: memoryUsage,
        cpu_percent: cpuPercent,
        gpu_percent: gpuPercent,
        created_at: new Date().toISOString()
      };
      this.db.appUsageLogs.push(log);
      // App usage log saved silently
      return Promise.resolve();
    }
  }

  async insertBrowserSearchLog(pcName, browser, url, searchQuery, searchEngine, timestamp) {
    // Convert to ISO string to preserve timezone
    const formattedTimestamp = new Date(timestamp).toISOString();

    if (this.type === 'supabase') {
      return await this.db.insertBrowserSearchLog(pcName, browser, url, searchQuery, searchEngine, formattedTimestamp);
    } else {
      // In-memory storage
      const log = {
        id: this.db.browserSearchLogs.length + 1,
        pc_name: pcName,
        browser: browser,
        url: url,
        search_query: searchQuery,
        search_engine: searchEngine,
        timestamp: formattedTimestamp,
        created_at: new Date().toISOString()
      };
      this.db.browserSearchLogs.push(log);
      // Browser activity saved silently
      return Promise.resolve();
    }
  }

  async insertIdleLog(pcName, startTime, endTime, duration) {
    // Convert to ISO strings to preserve timezone
    const formattedStartTime = new Date(startTime).toISOString();
    const formattedEndTime = new Date(endTime).toISOString();

    if (this.type === 'supabase') {
      return await this.db.insertIdleLog(pcName, formattedStartTime, formattedEndTime, duration);
    } else {
      // In-memory storage
      const log = {
        id: this.db.idleLogs.length + 1,
        pc_name: pcName,
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        duration_seconds: duration,
        created_at: new Date().toISOString()
      };
      this.db.idleLogs.push(log);
      // Idle log saved silently
      return Promise.resolve();
    }
  }

  async getTimeLogs() {
    if (this.type === 'supabase') {
      return await this.db.getTimeLogs();
    } else {
      // In-memory storage
      return Promise.resolve(this.db.timeLogs.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)));
    }
  }

  async getBrowserLogs(pcName, searchEngine, limit) {
    if (this.type === 'supabase') {
      return await this.db.getBrowserLogs(pcName, searchEngine, limit);
    } else {
      // In-memory storage
      let logs = this.db.browserSearchLogs;
      
      if (pcName) {
        logs = logs.filter(log => log.pc_name === pcName);
      }
      if (searchEngine) {
        logs = logs.filter(log => log.search_engine === searchEngine);
      }
      
      logs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (limit) {
        logs = logs.slice(0, limit);
      }
      
      return Promise.resolve(logs);
    }
  }

  // Update or insert PC status
  async updatePCStatus(pcName, isOnline, lastSeen, lastActivity, isIdle) {
    try {
      // Store dates as ISO strings (includes timezone info) instead of formatted strings
      // This ensures timezone is preserved correctly
      let formattedLastSeen = null;
      let formattedLastActivity = null;
      
      if (lastSeen) {
        if (typeof lastSeen === 'string' && (lastSeen.includes('AM') || lastSeen.includes('PM'))) {
          // If it's already in the custom format, parse it back to Date first
          formattedLastSeen = new Date(lastSeen).toISOString();
        } else {
          // If it's a Date object or ISO string, convert to ISO
          formattedLastSeen = new Date(lastSeen).toISOString();
        }
      }
      
      if (lastActivity) {
        if (typeof lastActivity === 'string' && (lastActivity.includes('AM') || lastActivity.includes('PM'))) {
          formattedLastActivity = new Date(lastActivity).toISOString();
        } else {
          formattedLastActivity = new Date(lastActivity).toISOString();
        }
      }

      // Both Supabase and in-memory storage use the same structure
      const pcStatus = {
        pc_name: pcName
      };
      
      // Only include fields that are not null/undefined
      if (isOnline !== null && isOnline !== undefined) {
        pcStatus.is_online = isOnline;
      }
      if (formattedLastSeen) {
        pcStatus.last_seen = formattedLastSeen;
      }
      if (formattedLastActivity) {
        pcStatus.last_activity = formattedLastActivity;
      }
      if (isIdle !== null && isIdle !== undefined) {
        pcStatus.is_idle = isIdle;
      }

      if (this.type === 'supabase') {
        // For Supabase, update using the existing client
        await this.db.updatePCStatus(pcStatus);
      } else {
        // In-memory storage - merge with existing status
        if (!this.db.pcStatus) this.db.pcStatus = {};
        this.db.pcStatus[pcName] = { ...this.db.pcStatus[pcName], ...pcStatus };
      }
      // PC status updated successfully
      return Promise.resolve();
    } catch (error) {
      console.error(`❌ Error updating PC status for ${pcName}:`, error);
      console.error('Error stack:', error.stack);
      // Re-throw to allow server to handle it
      throw error;
    }
  }

  // Get all PC statuses
  async getAllPCStatus() {
    if (this.type === 'supabase') {
      return await this.db.getAllPCStatus();
    } else {
      // In-memory storage
      return Promise.resolve(Object.values(this.db.pcStatus || {}));
    }
  }
}

module.exports = Database;
module.exports.to12HourFormat = to12HourFormat;
