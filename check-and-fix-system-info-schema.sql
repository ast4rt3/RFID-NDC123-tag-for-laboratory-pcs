-- Check and fix system_info table schema
-- Run this in Supabase SQL Editor

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'system_info'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add cpu_model if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'cpu_model') THEN
        ALTER TABLE system_info ADD COLUMN cpu_model VARCHAR(200);
        RAISE NOTICE 'Added cpu_model column';
    END IF;

    -- Add cpu_cores if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'cpu_cores') THEN
        ALTER TABLE system_info ADD COLUMN cpu_cores INTEGER;
        RAISE NOTICE 'Added cpu_cores column';
    END IF;

    -- Add cpu_speed_ghz if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'cpu_speed_ghz') THEN
        ALTER TABLE system_info ADD COLUMN cpu_speed_ghz REAL;
        RAISE NOTICE 'Added cpu_speed_ghz column';
    END IF;

    -- Add total_memory_gb if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'total_memory_gb') THEN
        ALTER TABLE system_info ADD COLUMN total_memory_gb REAL;
        RAISE NOTICE 'Added total_memory_gb column';
    END IF;

    -- Add os_platform if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'os_platform') THEN
        ALTER TABLE system_info ADD COLUMN os_platform VARCHAR(50);
        RAISE NOTICE 'Added os_platform column';
    END IF;

    -- Add os_version if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'os_version') THEN
        ALTER TABLE system_info ADD COLUMN os_version VARCHAR(100);
        RAISE NOTICE 'Added os_version column';
    END IF;

    -- Add hostname if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'hostname') THEN
        ALTER TABLE system_info ADD COLUMN hostname VARCHAR(100);
        RAISE NOTICE 'Added hostname column';
    END IF;

    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE system_info ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;

    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE system_info ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Add UNIQUE constraint on pc_name if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'system_info_pc_name_key' 
        AND conrelid = 'system_info'::regclass
    ) THEN
        ALTER TABLE system_info ADD CONSTRAINT system_info_pc_name_key UNIQUE (pc_name);
        RAISE NOTICE 'Added UNIQUE constraint on pc_name';
    END IF;
END $$;

-- Verify the final schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'system_info'
ORDER BY ordinal_position;

-- Verify constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'system_info'::regclass;