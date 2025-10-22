-- RFID Laboratory Monitor Database Schema
-- Updated for temperature tracking and overclocking detection

-- Time logs table (existing)
CREATE TABLE IF NOT EXISTS time_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- App usage logs table (updated - removed GPU tracking)
CREATE TABLE IF NOT EXISTS app_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL,
  app_name TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INTEGER NOT NULL,
  memory_usage_bytes INTEGER,
  cpu_percent REAL,
  cpu_temperature REAL,  -- NEW: CPU temperature in Celsius
  is_cpu_overclocked BOOLEAN DEFAULT FALSE,  -- NEW: CPU overclocking detection
  is_ram_overclocked BOOLEAN DEFAULT FALSE,  -- NEW: RAM overclocking detection
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pc_name, app_name, start_time)
);

-- Browser search logs table (existing)
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

-- NEW: System temperature monitoring table
CREATE TABLE IF NOT EXISTS temperature_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL,
  cpu_temperature REAL NOT NULL,
  gpu_temperature REAL,
  motherboard_temperature REAL,
  ambient_temperature REAL,
  timestamp DATETIME NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE,  -- Temperature above safe threshold
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Overclocking detection table
CREATE TABLE IF NOT EXISTS overclocking_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL,
  alert_type TEXT NOT NULL,  -- 'cpu_overclock', 'ram_overclock', 'gpu_overclock'
  component_name TEXT NOT NULL,  -- 'CPU', 'RAM', 'GPU'
  original_frequency INTEGER,  -- Original frequency in MHz
  current_frequency INTEGER,  -- Current frequency in MHz
  overclock_percentage REAL,  -- Percentage of overclock
  temperature_impact REAL,  -- Temperature increase due to overclock
  timestamp DATETIME NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NEW: PC hardware specifications table
CREATE TABLE IF NOT EXISTS pc_hardware_specs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL UNIQUE,
  cpu_model TEXT,
  cpu_base_frequency INTEGER,  -- Base frequency in MHz
  cpu_max_frequency INTEGER,   -- Max turbo frequency in MHz
  ram_capacity_gb INTEGER,
  ram_speed_mhz INTEGER,
  gpu_model TEXT,
  gpu_base_frequency INTEGER,
  motherboard_model TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NEW: System performance metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL,
  cpu_usage_percent REAL,
  memory_usage_percent REAL,
  cpu_temperature REAL,
  gpu_temperature REAL,
  cpu_frequency INTEGER,  -- Current CPU frequency in MHz
  memory_frequency INTEGER,  -- Current RAM frequency in MHz
  is_cpu_overclocked BOOLEAN DEFAULT FALSE,
  is_ram_overclocked BOOLEAN DEFAULT FALSE,
  is_gpu_overclocked BOOLEAN DEFAULT FALSE,
  power_consumption_watts REAL,
  fan_speed_rpm INTEGER,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NEW: Temperature thresholds table
CREATE TABLE IF NOT EXISTS temperature_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pc_name TEXT NOT NULL,
  component_type TEXT NOT NULL,  -- 'CPU', 'GPU', 'Motherboard', 'Ambient'
  warning_threshold REAL NOT NULL,  -- Warning temperature in Celsius
  critical_threshold REAL NOT NULL,  -- Critical temperature in Celsius
  max_safe_threshold REAL NOT NULL,  -- Maximum safe temperature
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_pc_name ON time_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_pc_name ON app_usage_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_start_time ON app_usage_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_overclocked ON app_usage_logs(is_cpu_overclocked, is_ram_overclocked);
CREATE INDEX IF NOT EXISTS idx_browser_search_logs_pc_name ON browser_search_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_browser_search_logs_timestamp ON browser_search_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_pc_name ON temperature_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_timestamp ON temperature_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_critical ON temperature_logs(is_critical);
CREATE INDEX IF NOT EXISTS idx_overclocking_alerts_pc_name ON overclocking_alerts(pc_name);
CREATE INDEX IF NOT EXISTS idx_overclocking_alerts_timestamp ON overclocking_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_overclocking_alerts_resolved ON overclocking_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_system_metrics_pc_name ON system_metrics(pc_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_metrics_overclocked ON system_metrics(is_cpu_overclocked, is_ram_overclocked, is_gpu_overclocked);

-- Views for easier querying

-- View: Current PC status with latest metrics
CREATE VIEW IF NOT EXISTS current_pc_status AS
SELECT 
  s.pc_name,
  s.cpu_usage_percent,
  s.memory_usage_percent,
  s.cpu_temperature,
  s.gpu_temperature,
  s.cpu_frequency,
  s.memory_frequency,
  s.is_cpu_overclocked,
  s.is_ram_overclocked,
  s.is_gpu_overclocked,
  s.timestamp as last_update,
  CASE 
    WHEN s.cpu_temperature > 80 THEN 'CRITICAL'
    WHEN s.cpu_temperature > 70 THEN 'WARNING'
    ELSE 'NORMAL'
  END as temperature_status
FROM system_metrics s
INNER JOIN (
  SELECT pc_name, MAX(timestamp) as latest_timestamp
  FROM system_metrics
  GROUP BY pc_name
) latest ON s.pc_name = latest.pc_name AND s.timestamp = latest.latest_timestamp;

-- View: Overclocking summary
CREATE VIEW IF NOT EXISTS overclocking_summary AS
SELECT 
  pc_name,
  COUNT(*) as total_alerts,
  COUNT(CASE WHEN is_resolved = FALSE THEN 1 END) as active_alerts,
  COUNT(CASE WHEN alert_type = 'cpu_overclock' THEN 1 END) as cpu_overclocks,
  COUNT(CASE WHEN alert_type = 'ram_overclock' THEN 1 END) as ram_overclocks,
  COUNT(CASE WHEN alert_type = 'gpu_overclock' THEN 1 END) as gpu_overclocks,
  MAX(timestamp) as last_alert_time
FROM overclocking_alerts
GROUP BY pc_name;

-- View: Temperature trends (last 24 hours)
CREATE VIEW IF NOT EXISTS temperature_trends AS
SELECT 
  pc_name,
  DATE(timestamp) as date,
  AVG(cpu_temperature) as avg_cpu_temp,
  MAX(cpu_temperature) as max_cpu_temp,
  MIN(cpu_temperature) as min_cpu_temp,
  COUNT(CASE WHEN is_critical = TRUE THEN 1 END) as critical_events
FROM temperature_logs
WHERE timestamp >= datetime('now', '-24 hours')
GROUP BY pc_name, DATE(timestamp);

-- Insert default temperature thresholds
INSERT OR IGNORE INTO temperature_thresholds (pc_name, component_type, warning_threshold, critical_threshold, max_safe_threshold)
VALUES 
  ('DEFAULT', 'CPU', 70.0, 80.0, 85.0),
  ('DEFAULT', 'GPU', 75.0, 85.0, 90.0),
  ('DEFAULT', 'Motherboard', 60.0, 70.0, 75.0),
  ('DEFAULT', 'Ambient', 30.0, 35.0, 40.0);

-- Sample queries for the new features:

-- Get current temperature status for all PCs
-- SELECT * FROM current_pc_status;

-- Get overclocking alerts for a specific PC
-- SELECT * FROM overclocking_alerts WHERE pc_name = 'PC-NAME' AND is_resolved = FALSE;

-- Get temperature history for the last 24 hours
-- SELECT * FROM temperature_logs WHERE pc_name = 'PC-NAME' AND timestamp >= datetime('now', '-24 hours') ORDER BY timestamp DESC;

-- Get system metrics with overclocking status
-- SELECT * FROM system_metrics WHERE is_cpu_overclocked = TRUE OR is_ram_overclocked = TRUE ORDER BY timestamp DESC;

-- Get temperature trends
-- SELECT * FROM temperature_trends WHERE pc_name = 'PC-NAME';


