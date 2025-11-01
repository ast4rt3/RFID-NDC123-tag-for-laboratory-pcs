const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database abstraction layer that supports both local SQLite and Supabase
class Database {
  constructor() {
    this.type = process.env.DB_TYPE || 'sqlite';
    this.db = null;
    this.init();
  }

  async init() {
    // Check if we should use Supabase
    if (this.type === 'supabase') {
      try {
        const SupabaseDB = require('./supabase-client');
        this.db = new SupabaseDB();
        console.log('✅ Using Supabase database');
        return;
      } catch (err) {
        console.error('❌ Supabase initialization failed:', err.message);
        console.log('⚠️ Falling back to SQLite...');
        this.type = 'sqlite';
      }
    }

    // Use SQLite as default or fallback
    if (this.type === 'sqlite') {
      try {
        const sqlite3 = require('sqlite3').verbose();
        const dbPath = path.join(__dirname, 'local.db');
        this.db = new sqlite3.Database(dbPath);
        await this.initLocalTables();
        console.log('✅ Using SQLite database at:', dbPath);
      } catch (err) {
        console.warn('⚠️ SQLite initialization failed, using memory storage:', err);
        this.type = 'memory';
        this.db = {
          timeLogs: [],
          appUsageLogs: []
        };
        console.log('✅ Using in-memory storage');
      }
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
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_time_logs_pc_name ON time_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
        CREATE INDEX IF NOT EXISTS idx_app_usage_logs_pc_name ON app_usage_logs(pc_name);
        CREATE INDEX IF NOT EXISTS idx_app_usage_logs_start_time ON app_usage_logs(start_time);
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
    if (this.type === 'sqlite') {
      return new Promise((resolve, reject) => {
        const sql = `INSERT INTO time_logs 
          (pc_name, start_time, end_time, duration_seconds) 
          VALUES (?, ?, ?, ?)`;
        this.db.run(sql, [pcName, startTime, endTime, duration], (err) => {
          if (err) {
            console.error('Error inserting time log:', err);
            reject(err);
          } else {
            console.log(`💾 Log saved for ${pcName}`);
            resolve();
          }
        });
      });
    } else if (this.type === 'supabase') {
      return await this.db.insertTimeLog(pcName, startTime, endTime, duration);
    } else {
      // In-memory storage
      if (!this.db.timeLogs) {
        this.db.timeLogs = [];
      }
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
    if (this.type === 'sqlite') {
      return new Promise((resolve, reject) => {
        // Use INSERT OR REPLACE to handle duplicate entries (based on UNIQUE constraint)
        const sql = `INSERT OR REPLACE INTO app_usage_logs
          (pc_name, app_name, start_time, end_time, duration_seconds, memory_usage_bytes, cpu_percent, gpu_percent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        this.db.run(sql, [pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent], (err) => {
          if (err) {
            console.error('Error inserting app usage log:', err);
            reject(err);
          } else {
            console.log('✅ App usage log saved');
            resolve();
          }
        });
      });
    } else if (this.type === 'supabase') {
      return await this.db.insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent);
    } else {
      // Memory storage fallback
      if (!this.db.appUsageLogs) {
        this.db.appUsageLogs = [];
      }
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
      console.log('✅ App usage log saved (memory)');
      return Promise.resolve();
    }
  }

  async getTimeLogs() {
    if (this.type === 'sqlite') {
      return new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM time_logs ORDER BY start_time DESC',
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    } else if (this.type === 'supabase') {
      return await this.db.getTimeLogs();
    } else {
      // In-memory storage
      return Promise.resolve(this.db.timeLogs.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)));
    }
  }
}

module.exports = Database;
