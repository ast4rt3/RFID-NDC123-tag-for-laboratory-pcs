-- Migration: Rename system_metrics table to system_info
-- This script handles the case where the table was created as system_metrics

-- Step 1: Check if system_metrics exists and system_info doesn't
DO $$
BEGIN
    -- If system_metrics exists and system_info doesn't, rename it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_metrics')
       AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_info') THEN
        
        ALTER TABLE system_metrics RENAME TO system_info;
        RAISE NOTICE 'Table renamed from system_metrics to system_info';
        
    -- If both exist, we need to merge data
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_metrics')
          AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_info') THEN
        
        -- Copy data from system_metrics to system_info (if columns match)
        INSERT INTO system_info (pc_name, cpu_model, cpu_cores, cpu_speed_ghz, total_memory_gb, os_platform, os_version, hostname, created_at, updated_at)
        SELECT pc_name, cpu_model, cpu_cores, cpu_speed_ghz, total_memory_gb, os_platform, os_version, hostname, created_at, updated_at
        FROM system_metrics
        ON CONFLICT (pc_name) DO UPDATE SET
            cpu_model = EXCLUDED.cpu_model,
            cpu_cores = EXCLUDED.cpu_cores,
            cpu_speed_ghz = EXCLUDED.cpu_speed_ghz,
            total_memory_gb = EXCLUDED.total_memory_gb,
            os_platform = EXCLUDED.os_platform,
            os_version = EXCLUDED.os_version,
            hostname = EXCLUDED.hostname,
            updated_at = NOW();
        
        -- Drop the old table
        DROP TABLE system_metrics;
        RAISE NOTICE 'Data merged from system_metrics to system_info and old table dropped';
        
    -- If only system_info exists, we're good
    ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_info') THEN
        RAISE NOTICE 'Table system_info already exists, no migration needed';
        
    -- If neither exists, create system_info
    ELSE
        CREATE TABLE system_info (
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
        
        CREATE INDEX idx_system_info_pc_name ON system_info(pc_name);
        
        ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Allow all operations on system_info" ON system_info FOR ALL USING (true);
        
        CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created new system_info table';
    END IF;
END $$;

-- Verify the final state
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('system_info', 'system_metrics')
ORDER BY table_name, ordinal_position;