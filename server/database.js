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

  async insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, cpuTemperature, isCpuOverclocked, isRamOverclocked) {
    if (this.type === 'supabase') {
      return await this.db.insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, cpuTemperature, isCpuOverclocked, isRamOverclocked);
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
        cpu_temperature: cpuTemperature,
        is_cpu_overclocked: isCpuOverclocked || false,
        is_ram_overclocked: isRamOverclocked || false,
        created_at: new Date().toISOString()
      };
      this.db.appUsageLogs.push(log);
      console.log('App usage log saved with temperature and overclocking data');
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

  // NEW: Temperature tracking methods
  async insertTemperatureLog(pcName, cpuTemp, gpuTemp, motherboardTemp, ambientTemp, isCritical) {
    if (this.type === 'supabase') {
      return await this.db.insertTemperatureLog(pcName, cpuTemp, gpuTemp, motherboardTemp, ambientTemp, isCritical);
    } else {
      // In-memory storage
      if (!this.db.temperatureLogs) this.db.temperatureLogs = [];
      
      const log = {
        id: this.db.temperatureLogs.length + 1,
        pc_name: pcName,
        cpu_temperature: cpuTemp,
        gpu_temperature: gpuTemp,
        motherboard_temperature: motherboardTemp,
        ambient_temperature: ambientTemp,
        timestamp: new Date().toISOString(),
        is_critical: isCritical || false,
        created_at: new Date().toISOString()
      };
      this.db.temperatureLogs.push(log);
      console.log('Temperature log saved');
      return Promise.resolve();
    }
  }

  async getTemperatureLogs(pcName, limit) {
    if (this.type === 'supabase') {
      return await this.db.getTemperatureLogs(pcName, limit);
    } else {
      // In-memory storage
      if (!this.db.temperatureLogs) return Promise.resolve([]);
      
      let logs = this.db.temperatureLogs;
      
      if (pcName) {
        logs = logs.filter(log => log.pc_name === pcName);
      }
      
      logs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (limit) {
        logs = logs.slice(0, limit);
      }
      
      return Promise.resolve(logs);
    }
  }

  // NEW: Overclocking detection methods
  async insertOverclockingAlert(pcName, alertType, componentName, originalFreq, currentFreq, overclockPercent, tempImpact) {
    if (this.type === 'supabase') {
      return await this.db.insertOverclockingAlert(pcName, alertType, componentName, originalFreq, currentFreq, overclockPercent, tempImpact);
    } else {
      // In-memory storage
      if (!this.db.overclockingAlerts) this.db.overclockingAlerts = [];
      
      const alert = {
        id: this.db.overclockingAlerts.length + 1,
        pc_name: pcName,
        alert_type: alertType,
        component_name: componentName,
        original_frequency: originalFreq,
        current_frequency: currentFreq,
        overclock_percentage: overclockPercent,
        temperature_impact: tempImpact,
        timestamp: new Date().toISOString(),
        is_resolved: false,
        created_at: new Date().toISOString()
      };
      this.db.overclockingAlerts.push(alert);
      console.log('Overclocking alert saved');
      return Promise.resolve();
    }
  }

  async getOverclockingAlerts(pcName, limit) {
    if (this.type === 'supabase') {
      return await this.db.getOverclockingAlerts(pcName, limit);
    } else {
      // In-memory storage
      if (!this.db.overclockingAlerts) return Promise.resolve([]);
      
      let alerts = this.db.overclockingAlerts;
      
      if (pcName) {
        alerts = alerts.filter(alert => alert.pc_name === pcName);
      }
      
      alerts = alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (limit) {
        alerts = alerts.slice(0, limit);
      }
      
      return Promise.resolve(alerts);
    }
  }

  // NEW: System metrics methods
  async insertSystemMetrics(pcName, cpuUsage, memoryUsage, cpuTemp, gpuTemp, cpuFreq, memoryFreq, isCpuOverclocked, isRamOverclocked, isGpuOverclocked, powerConsumption, fanSpeed) {
    if (this.type === 'supabase') {
      return await this.db.insertSystemMetrics(pcName, cpuUsage, memoryUsage, cpuTemp, gpuTemp, cpuFreq, memoryFreq, isCpuOverclocked, isRamOverclocked, isGpuOverclocked, powerConsumption, fanSpeed);
    } else {
      // In-memory storage
      if (!this.db.systemMetrics) this.db.systemMetrics = [];
      
      const metrics = {
        id: this.db.systemMetrics.length + 1,
        pc_name: pcName,
        cpu_usage_percent: cpuUsage,
        memory_usage_percent: memoryUsage,
        cpu_temperature: cpuTemp,
        gpu_temperature: gpuTemp,
        cpu_frequency: cpuFreq,
        memory_frequency: memoryFreq,
        is_cpu_overclocked: isCpuOverclocked || false,
        is_ram_overclocked: isRamOverclocked || false,
        is_gpu_overclocked: isGpuOverclocked || false,
        power_consumption_watts: powerConsumption,
        fan_speed_rpm: fanSpeed,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      this.db.systemMetrics.push(metrics);
      console.log('System metrics saved');
      return Promise.resolve();
    }
  }

  async getSystemMetrics(pcName, limit) {
    if (this.type === 'supabase') {
      return await this.db.getSystemMetrics(pcName, limit);
    } else {
      // In-memory storage
      if (!this.db.systemMetrics) return Promise.resolve([]);
      
      let metrics = this.db.systemMetrics;
      
      if (pcName) {
        metrics = metrics.filter(metric => metric.pc_name === pcName);
      }
      
      metrics = metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (limit) {
        metrics = metrics.slice(0, limit);
      }
      
      return Promise.resolve(metrics);
    }
  }

  async getPCStatus() {
    if (this.type === 'supabase') {
      return await this.db.getPCStatus();
    } else {
      // In-memory storage - get latest metrics for each PC
      if (!this.db.systemMetrics) return Promise.resolve([]);
      
      const latestMetrics = {};
      this.db.systemMetrics.forEach(metric => {
        if (!latestMetrics[metric.pc_name] || new Date(metric.timestamp) > new Date(latestMetrics[metric.pc_name].timestamp)) {
          latestMetrics[metric.pc_name] = metric;
        }
      });
      
      return Promise.resolve(Object.values(latestMetrics));
    }
  }


  async insertTemperatureLog(pcName, cpuTemperature, gpuTemperature, systemTemperature, ambientTemperature, isCritical) {
    if (this.type === 'supabase') {
      return await this.db.insertTemperatureLog(pcName, cpuTemperature, gpuTemperature, systemTemperature, ambientTemperature, isCritical);
    } else {
      // In-memory storage
      const tempLog = {
        id: (this.db.temperatureLogs || []).length + 1,
        pc_name: pcName,
        timestamp: new Date().toISOString(),
        cpu_temperature: cpuTemperature,
        gpu_temperature: gpuTemperature,
        system_temperature: systemTemperature,
        ambient_temperature: ambientTemperature,
        temperature_unit: 'celsius',
        is_critical: isCritical || false,
        created_at: new Date().toISOString()
      };
      
      if (!this.db.temperatureLogs) this.db.temperatureLogs = [];
      this.db.temperatureLogs.push(tempLog);
      console.log('Temperature log saved');
      return Promise.resolve();
    }
  }

  async updatePCStatus(pcName, isOnline, currentApp, systemStatus) {
    if (this.type === 'supabase') {
      return await this.db.updatePCStatus(pcName, isOnline, currentApp, systemStatus);
    } else {
      // In-memory storage
      if (!this.db.pcStatus) this.db.pcStatus = {};
      
      this.db.pcStatus[pcName] = {
        pc_name: pcName,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        current_app: currentApp,
        system_status: systemStatus || 'normal',
        updated_at: new Date().toISOString()
      };
      
      console.log(`PC status updated for ${pcName}: ${systemStatus}`);
      return Promise.resolve();
    }
  }

  async getSystemMetrics(pcName, limit = 100) {
    if (this.type === 'supabase') {
      return await this.db.getSystemMetrics(pcName, limit);
    } else {
      // In-memory storage
      let metrics = this.db.systemMetrics || [];
      
      if (pcName) {
        metrics = metrics.filter(m => m.pc_name === pcName);
      }
      
      metrics = metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (limit) {
        metrics = metrics.slice(0, limit);
      }
      
      return Promise.resolve(metrics);
    }
  }

  async getOverclockingAlerts(pcName, limit = 50) {
    if (this.type === 'supabase') {
      return await this.db.getOverclockingAlerts(pcName, limit);
    } else {
      // In-memory storage
      let metrics = this.db.systemMetrics || [];
      
      if (pcName) {
        metrics = metrics.filter(m => m.pc_name === pcName);
      }
      
      // Filter for overclocked systems
      metrics = metrics.filter(m => m.is_cpu_overclocked || m.is_ram_overclocked);
      
      metrics = metrics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      if (limit) {
        metrics = metrics.slice(0, limit);
      }
      
      return Promise.resolve(metrics);
    }
  }

  async getPCStatus() {
    if (this.type === 'supabase') {
      return await this.db.getPCStatus();
    } else {
      // In-memory storage
      const statuses = Object.values(this.db.pcStatus || {});
      return Promise.resolve(statuses);
    }
  }
}

module.exports = Database;
