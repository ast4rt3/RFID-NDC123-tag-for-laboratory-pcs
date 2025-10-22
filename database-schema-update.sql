-- Updated Database Schema for RFID Monitoring System
-- Version: 2.0
-- Changes: Added temperature monitoring, overclocking indicators, removed GPU features

-- ============================================
-- 1. DROP EXISTING TABLES (if they exist)
-- ============================================

DROP TABLE IF EXISTS `app_usage_logs`;
DROP TABLE IF EXISTS `time_logs`;
DROP TABLE IF EXISTS `browser_search_logs`;
DROP TABLE IF EXISTS `system_metrics`;
DROP TABLE IF EXISTS `temperature_logs`;

-- ============================================
-- 2. CREATE UPDATED TABLES
-- ============================================

-- Time logs table (unchanged)
CREATE TABLE `time_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(50) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_seconds` int(11) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pc_name` (`pc_name`),
  KEY `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Updated app usage logs table (removed GPU, added temperature and overclocking indicators)
CREATE TABLE `app_usage_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(50) NOT NULL,
  `app_name` varchar(100) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_seconds` int(11) NOT NULL,
  `memory_usage_bytes` bigint(20) DEFAULT NULL,
  `cpu_percent` decimal(5,2) DEFAULT NULL,
  `cpu_temperature` decimal(5,2) DEFAULT NULL COMMENT 'CPU temperature in Celsius',
  `is_cpu_overclocked` tinyint(1) DEFAULT 0 COMMENT '1 if CPU is overclocked, 0 if normal',
  `is_ram_overclocked` tinyint(1) DEFAULT 0 COMMENT '1 if RAM is overclocked, 0 if normal',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_session` (`pc_name`, `app_name`, `start_time`),
  KEY `idx_pc_name` (`pc_name`),
  KEY `idx_start_time` (`start_time`),
  KEY `idx_overclocked` (`is_cpu_overclocked`, `is_ram_overclocked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Browser search logs table (unchanged)
CREATE TABLE `browser_search_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(50) NOT NULL,
  `browser` varchar(50) NOT NULL,
  `url` text DEFAULT NULL,
  `search_query` text DEFAULT NULL,
  `search_engine` varchar(50) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_search` (`pc_name`, `browser`, `url`(255), `timestamp`),
  KEY `idx_pc_name` (`pc_name`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New table for system metrics and temperature monitoring
CREATE TABLE `system_metrics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(50) NOT NULL,
  `timestamp` datetime NOT NULL,
  `cpu_percent` decimal(5,2) DEFAULT NULL,
  `memory_percent` decimal(5,2) DEFAULT NULL,
  `memory_usage_bytes` bigint(20) DEFAULT NULL,
  `cpu_temperature` decimal(5,2) DEFAULT NULL,
  `system_temperature` decimal(5,2) DEFAULT NULL COMMENT 'Overall system temperature',
  `is_cpu_overclocked` tinyint(1) DEFAULT 0,
  `is_ram_overclocked` tinyint(1) DEFAULT 0,
  `cpu_frequency_mhz` int(11) DEFAULT NULL COMMENT 'Current CPU frequency',
  `ram_frequency_mhz` int(11) DEFAULT NULL COMMENT 'Current RAM frequency',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pc_name` (`pc_name`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_overclocked` (`is_cpu_overclocked`, `is_ram_overclocked`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New table for detailed temperature logs
CREATE TABLE `temperature_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(50) NOT NULL,
  `timestamp` datetime NOT NULL,
  `cpu_temperature` decimal(5,2) DEFAULT NULL,
  `gpu_temperature` decimal(5,2) DEFAULT NULL,
  `system_temperature` decimal(5,2) DEFAULT NULL,
  `ambient_temperature` decimal(5,2) DEFAULT NULL,
  `temperature_unit` varchar(10) DEFAULT 'celsius',
  `is_critical` tinyint(1) DEFAULT 0 COMMENT '1 if temperature is above safe threshold',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pc_name` (`pc_name`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_critical` (`is_critical`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- New table for PC status tracking
CREATE TABLE `pc_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(50) NOT NULL,
  `is_online` tinyint(1) DEFAULT 0,
  `last_seen` datetime DEFAULT NULL,
  `last_activity` datetime DEFAULT NULL,
  `current_app` varchar(100) DEFAULT NULL,
  `system_status` enum('normal','overclocked','critical','offline') DEFAULT 'normal',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_pc` (`pc_name`),
  KEY `idx_online` (`is_online`),
  KEY `idx_status` (`system_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- View for app daily summary with temperature data
CREATE VIEW `app_daily_summary` AS
SELECT 
    pc_name,
    app_name,
    DATE(start_time) as day,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_app_usage_seconds,
    AVG(cpu_percent) as avg_cpu_percent,
    AVG(cpu_temperature) as avg_cpu_temperature,
    MAX(cpu_temperature) as max_cpu_temperature,
    SUM(is_cpu_overclocked) as cpu_overclocked_sessions,
    SUM(is_ram_overclocked) as ram_overclocked_sessions
FROM app_usage_logs
GROUP BY pc_name, app_name, DATE(start_time);

-- View for system health overview
CREATE VIEW `system_health_overview` AS
SELECT 
    pc_name,
    DATE(timestamp) as date,
    AVG(cpu_percent) as avg_cpu_percent,
    AVG(memory_percent) as avg_memory_percent,
    AVG(cpu_temperature) as avg_cpu_temperature,
    MAX(cpu_temperature) as max_cpu_temperature,
    SUM(is_cpu_overclocked) as overclocked_cpu_count,
    SUM(is_ram_overclocked) as overclocked_ram_count,
    COUNT(*) as total_measurements
FROM system_metrics
GROUP BY pc_name, DATE(timestamp);

-- View for overclocking alerts
CREATE VIEW `overclocking_alerts` AS
SELECT 
    pc_name,
    timestamp,
    cpu_percent,
    memory_percent,
    cpu_temperature,
    cpu_frequency_mhz,
    ram_frequency_mhz,
    is_cpu_overclocked,
    is_ram_overclocked,
    CASE 
        WHEN is_cpu_overclocked = 1 AND is_ram_overclocked = 1 THEN 'Both CPU and RAM overclocked'
        WHEN is_cpu_overclocked = 1 THEN 'CPU overclocked'
        WHEN is_ram_overclocked = 1 THEN 'RAM overclocked'
        ELSE 'Normal'
    END as overclock_status
FROM system_metrics
WHERE is_cpu_overclocked = 1 OR is_ram_overclocked = 1;

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Additional indexes for better query performance
CREATE INDEX idx_app_usage_temperature ON app_usage_logs(cpu_temperature);
CREATE INDEX idx_app_usage_overclock ON app_usage_logs(is_cpu_overclocked, is_ram_overclocked);
CREATE INDEX idx_system_metrics_temp ON system_metrics(cpu_temperature);
CREATE INDEX idx_temperature_critical ON temperature_logs(is_critical);

-- ============================================
-- 5. INSERT SAMPLE DATA (Optional)
-- ============================================

-- Insert sample PC status
INSERT INTO `pc_status` (`pc_name`, `is_online`, `last_seen`, `system_status`) VALUES
('LAB-PC-01', 0, NOW(), 'offline'),
('LAB-PC-02', 0, NOW(), 'offline'),
('LAB-PC-03', 0, NOW(), 'offline');

-- ============================================
-- 6. MIGRATION NOTES
-- ============================================

/*
MIGRATION INSTRUCTIONS:

1. BACKUP YOUR EXISTING DATA:
   - Export existing app_usage_logs data
   - Export existing time_logs data
   - Export existing browser_search_logs data

2. APPLY THIS SCHEMA:
   - Run this SQL script on your database
   - This will drop and recreate tables with new structure

3. DATA MIGRATION:
   - Import your existing data into the new tables
   - The new columns (temperature, overclocking indicators) will be NULL for existing data

4. UPDATE YOUR APPLICATION:
   - Update server code to use new schema
   - Update client to send temperature and overclocking data
   - Remove GPU-related code

5. NEW FEATURES:
   - Temperature monitoring in app usage logs
   - CPU/RAM overclocking detection
   - System metrics tracking
   - PC status tracking
   - Enhanced reporting views

6. API ENDPOINTS TO UPDATE:
   - GET /api/app-usage - now includes temperature data
   - GET /api/system-metrics - new endpoint for system metrics
   - GET /api/temperature-logs - new endpoint for temperature logs
   - GET /api/pc-status - new endpoint for PC status
   - GET /api/overclocking-alerts - new endpoint for overclocking alerts
*/
