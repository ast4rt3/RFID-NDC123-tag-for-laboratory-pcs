-- Supabase PostgreSQL Schema for RFID Monitoring System
-- Converted from MySQL to PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_seconds INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create app_usage_logs table
CREATE TABLE IF NOT EXISTS app_usage_logs (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL,
    app_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_seconds INTEGER NOT NULL,
    memory_usage_bytes BIGINT,
    cpu_percent REAL,
    gpu_percent REAL,
    cpu_temperature REAL,
    is_cpu_overclocked BOOLEAN,
    is_ram_overclocked BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_app_usage UNIQUE (pc_name, app_name, start_time)
);

-- Create browser_search_logs table
CREATE TABLE IF NOT EXISTS browser_search_logs (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL,
    browser VARCHAR(50) NOT NULL,
    url TEXT,
    search_query TEXT,
    search_engine VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_browser_search UNIQUE (pc_name, browser, url, timestamp)
);

-- Create system_info table (stores one-time system information per PC)
CREATE TABLE IF NOT EXISTS system_info (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL UNIQUE,
    cpu_model VARCHAR(200),
    cpu_cores INTEGER,
    cpu_speed_ghz REAL,
    total_memory_gb REAL,
    os_platform VARCHAR(50),
    os_version VARCHAR(100),
    hostname VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_time_logs_pc_name ON time_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_time_logs_start_time ON time_logs(start_time);

CREATE INDEX IF NOT EXISTS idx_app_usage_logs_pc_name ON app_usage_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_app_name ON app_usage_logs(app_name);
CREATE INDEX IF NOT EXISTS idx_app_usage_logs_start_time ON app_usage_logs(start_time);

CREATE INDEX IF NOT EXISTS idx_browser_search_logs_pc_name ON browser_search_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_browser_search_logs_timestamp ON browser_search_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_browser_search_logs_search_engine ON browser_search_logs(search_engine);

CREATE INDEX IF NOT EXISTS idx_system_info_pc_name ON system_info(pc_name);

-- Create views for reporting (PostgreSQL equivalent)
CREATE OR REPLACE VIEW app_daily_summary AS
SELECT 
    pc_name,
    app_name,
    DATE(start_time) as day,
    COUNT(*) as session_count,
    SUM(duration_seconds) as total_app_usage_seconds
FROM app_usage_logs
GROUP BY pc_name, app_name, DATE(start_time);

CREATE OR REPLACE VIEW pc_session_resource_avg AS
SELECT 
    t.pc_name,
    t.start_time as session_start,
    t.end_time as session_end,
    t.duration_seconds as session_duration,
    AVG(a.memory_usage_bytes) as avg_memory_usage_bytes,
    AVG(a.cpu_percent) as avg_cpu_percent,
    AVG(a.gpu_percent) as avg_gpu_percent
FROM time_logs t
LEFT JOIN app_usage_logs a ON t.pc_name = a.pc_name 
    AND a.start_time BETWEEN t.start_time AND t.end_time
GROUP BY t.id, t.pc_name, t.start_time, t.end_time, t.duration_seconds
ORDER BY t.pc_name ASC, t.start_time DESC;

CREATE OR REPLACE VIEW pc_session_resource_summary AS
SELECT 
    t.pc_name,
    t.start_time as session_start,
    t.end_time as session_end,
    t.duration_seconds as session_duration,
    SUM(a.memory_usage_bytes) as total_memory_usage_bytes,
    SUM(a.cpu_percent) as total_cpu_percent,
    SUM(a.gpu_percent) as total_gpu_percent
FROM time_logs t
LEFT JOIN app_usage_logs a ON t.pc_name = a.pc_name 
    AND a.start_time BETWEEN t.start_time AND t.end_time
GROUP BY t.id, t.pc_name, t.start_time, t.end_time, t.duration_seconds
ORDER BY t.pc_name ASC, t.start_time DESC;

-- Enable Row Level Security (RLS) for better security
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (allow all operations for now - customize as needed)
CREATE POLICY "Allow all operations on time_logs" ON time_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on app_usage_logs" ON app_usage_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on browser_search_logs" ON browser_search_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on system_info" ON system_info FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_time_logs_updated_at BEFORE UPDATE ON time_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_usage_logs_updated_at BEFORE UPDATE ON app_usage_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_browser_search_logs_updated_at BEFORE UPDATE ON browser_search_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
