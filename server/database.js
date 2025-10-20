const fs = require('fs');
const path = require('path');

// Database abstraction layer that supports both local SQLite and Supabase
class Database {
  constructor() {
    this.type = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'supabase'
    this.db = null;
    this.init();
  }

  async init() {
    if (this.type === 'supabase') {
      const SupabaseDB = require('./supabase-client');
      this.db = new SupabaseDB();
      const connected = await this.db.testConnection();
      if (!connected) {
        console.warn('⚠️ Supabase connection failed, using memory storage');
        this.type = 'memory';
        this.init();
        return;
      }
      console.log('✅ Using Supabase database');
    } else {
      // Use in-memory storage for now (no sqlite3 dependency)
      this.db = {
        timeLogs: [],
        appUsageLogs: [],
        browserSearchLogs: []
      };
      console.log('✅ Using in-memory storage');
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

        CREATE INDEX IF NOT EXISTS idx_time_logs_pc_name ON time_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_app_usage_logs_pc_name ON app_usage_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_app_usage_logs_start_time ON app_usage_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_browser_search_logs_pc_name ON browser_search_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_browser_search_logs_timestamp ON browser_search_logs(timestamp);
      `;

      this.db.exec(createTables, (err) => {
        if (err) {
          console.error('Error creating local tables:', err);
          reject(err);
        } else {
          console.log('✅ Local database tables initialized');
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
    if (this.type === 'supabase') {
      return await this.db.insertTimeLog(pcName, startTime, endTime, duration);
    } else {
      // In-memory storage
      const log = {
        id: this.db.timeLogs.length + 1,
        pc_name: pcName,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: duration,
        created_at: new Date().toISOString()
      };
      this.db.timeLogs.push(log);
      console.log(`💾 Log saved for ${pcName}`);
      return Promise.resolve();
    }
  }

  async insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent) {
    if (this.type === 'supabase') {
      return await this.db.insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent);
    } else {
      // In-memory storage
      const log = {
        id: this.db.appUsageLogs.length + 1,
        pc_name: pcName,
        app_name: appName,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: duration,
        memory_usage_bytes: memoryUsage,
        cpu_percent: cpuPercent,
        gpu_percent: gpuPercent,
        created_at: new Date().toISOString()
      };
      this.db.appUsageLogs.push(log);
      console.log('App usage log saved');
      return Promise.resolve();
    }
  }

  async insertBrowserSearchLog(pcName, browser, url, searchQuery, searchEngine, timestamp) {
    if (this.type === 'supabase') {
      return await this.db.insertBrowserSearchLog(pcName, browser, url, searchQuery, searchEngine, timestamp);
    } else {
      // In-memory storage
      const log = {
        id: this.db.browserSearchLogs.length + 1,
        pc_name: pcName,
        browser: browser,
        url: url,
        search_query: searchQuery,
        search_engine: searchEngine,
        timestamp: timestamp,
        created_at: new Date().toISOString()
      };
      this.db.browserSearchLogs.push(log);
      console.log('✅ Browser activity saved to database');
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
}

module.exports = Database;
