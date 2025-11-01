-- Migration: Add system_info table to Supabase
-- This table stores one-time system information for each PC

-- Create system_info table if it doesn't exist
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_info_pc_name ON system_info(pc_name);

-- Enable Row Level Security
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- Create policy for RLS (allow all operations for now - customize as needed)
CREATE POLICY "Allow all operations on system_info" ON system_info FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'system_info' 
ORDER BY ordinal_position;

