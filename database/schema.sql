-- Table for logging PC session times
CREATE TABLE IF NOT EXISTS time_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INT NOT NULL
);

-- Table for logging application usage
CREATE TABLE IF NOT EXISTS app_usage_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pc_name VARCHAR(50) NOT NULL,
  app_name VARCHAR(100) NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  duration_seconds INT NOT NULL,
  UNIQUE KEY unique_app_usage (pc_name, app_name, start_time)
);

-- (Optional) Table for users, if you want to track by user
-- CREATE TABLE IF NOT EXISTS users (
--   id INT AUTO_INCREMENT PRIMARY KEY,
--   username VARCHAR(50) NOT NULL UNIQUE,
--   full_name VARCHAR(100)
-- );

-- View for daily app usage summary
CREATE OR REPLACE VIEW app_daily_summary AS
SELECT
  pc_name,
  app_name,
  DATE(start_time) AS day,
  COUNT(*) AS session_count,
  SUM(duration_seconds) AS total_app_usage_seconds
FROM app_usage_logs
GROUP BY pc_name, app_name, day;
