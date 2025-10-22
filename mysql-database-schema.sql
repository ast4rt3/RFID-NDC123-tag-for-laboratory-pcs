CREATE TABLE IF NOT EXISTS time_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INT NOT NULL,
  memory_usage_bytes BIGINT,
  cpu_percent DECIMAL(5,2),
  cpu_temperature DECIMAL(5,2),
  is_cpu_overclocked BOOLEAN DEFAULT FALSE,
  is_ram_overclocked BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_app_usage (pc_name, app_name, start_time)
);

CREATE TABLE IF NOT EXISTS browser_search_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  browser VARCHAR(50) NOT NULL,
  url TEXT,
  search_query TEXT,
  search_engine VARCHAR(50),
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_browser_search (pc_name, browser, url(255), timestamp)
);

CREATE TABLE IF NOT EXISTS temperature_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  cpu_temperature DECIMAL(5,2) NOT NULL,
  gpu_temperature DECIMAL(5,2),
  motherboard_temperature DECIMAL(5,2),
  ambient_temperature DECIMAL(5,2),
  timestamp DATETIME NOT NULL,
  is_critical BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS overclocking_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  component_name VARCHAR(50) NOT NULL,
  original_frequency INT,
  current_frequency INT,
  overclock_percentage DECIMAL(5,2),
  temperature_impact DECIMAL(5,2),
  timestamp DATETIME NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pc_hardware_specs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL UNIQUE,
  cpu_model VARCHAR(100),
  cpu_base_frequency INT,
  cpu_max_frequency INT,
  ram_capacity_gb INT,
  ram_speed_mhz INT,
  gpu_model VARCHAR(100),
  gpu_base_frequency INT,
  motherboard_model VARCHAR(100),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_percent DECIMAL(5,2),
  cpu_temperature DECIMAL(5,2),
  gpu_temperature DECIMAL(5,2),
  cpu_frequency INT,
  memory_frequency INT,
  is_cpu_overclocked BOOLEAN DEFAULT FALSE,
  is_ram_overclocked BOOLEAN DEFAULT FALSE,
  is_gpu_overclocked BOOLEAN DEFAULT FALSE,
  power_consumption_watts DECIMAL(8,2),
  fan_speed_rpm INT,
  timestamp DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temperature_thresholds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  component_type VARCHAR(50) NOT NULL,
  warning_threshold DECIMAL(5,2) NOT NULL,
  critical_threshold DECIMAL(5,2) NOT NULL,
  max_safe_threshold DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_time_logs_pc_name ON time_logs(pc_name);
CREATE INDEX idx_time_logs_start_time ON time_logs(start_time);
CREATE INDEX idx_app_usage_logs_pc_name ON app_usage_logs(pc_name);
CREATE INDEX idx_app_usage_logs_start_time ON app_usage_logs(start_time);
CREATE INDEX idx_app_usage_logs_overclocked ON app_usage_logs(is_cpu_overclocked, is_ram_overclocked);
CREATE INDEX idx_browser_search_logs_pc_name ON browser_search_logs(pc_name);
CREATE INDEX idx_browser_search_logs_timestamp ON browser_search_logs(timestamp);
CREATE INDEX idx_temperature_logs_pc_name ON temperature_logs(pc_name);
CREATE INDEX idx_temperature_logs_timestamp ON temperature_logs(timestamp);
CREATE INDEX idx_temperature_logs_critical ON temperature_logs(is_critical);
CREATE INDEX idx_overclocking_alerts_pc_name ON overclocking_alerts(pc_name);
CREATE INDEX idx_overclocking_alerts_timestamp ON overclocking_alerts(timestamp);
CREATE INDEX idx_overclocking_alerts_resolved ON overclocking_alerts(is_resolved);
CREATE INDEX idx_system_metrics_pc_name ON system_metrics(pc_name);
CREATE INDEX idx_system_metrics_timestamp ON system_metrics(timestamp);
CREATE INDEX idx_system_metrics_overclocked ON system_metrics(is_cpu_overclocked, is_ram_overclocked, is_gpu_overclocked);

CREATE VIEW current_pc_status AS
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

CREATE VIEW overclocking_summary AS
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

CREATE VIEW temperature_trends AS
SELECT 
  pc_name,
  DATE(timestamp) as date,
  AVG(cpu_temperature) as avg_cpu_temp,
  MAX(cpu_temperature) as max_cpu_temp,
  MIN(cpu_temperature) as min_cpu_temp,
  COUNT(CASE WHEN is_critical = TRUE THEN 1 END) as critical_events
FROM temperature_logs
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
GROUP BY pc_name, DATE(timestamp);

INSERT IGNORE INTO temperature_thresholds (pc_name, component_type, warning_threshold, critical_threshold, max_safe_threshold)
VALUES 
  ('DEFAULT', 'CPU', 70.0, 80.0, 85.0),
  ('DEFAULT', 'GPU', 75.0, 85.0, 90.0),
  ('DEFAULT', 'Motherboard', 60.0, 70.0, 75.0),
  ('DEFAULT', 'Ambient', 30.0, 35.0, 40.0);
