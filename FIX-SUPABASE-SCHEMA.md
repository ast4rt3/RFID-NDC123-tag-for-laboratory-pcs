# Fix Supabase system_info Table Schema

## Problem
The `system_info` table in your Supabase database is missing required columns, causing the error:
```
Could not find the 'cpu_cores' column of 'system_info' in the schema cache
```

## Solution

### Option 1: Run SQL in Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the following SQL:

```sql
-- Add missing columns to system_info table
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

-- Add UNIQUE constraint on pc_name (CRITICAL for upsert to work)
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

-- Verify the schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'system_info'
ORDER BY ordinal_position;

-- Verify constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'system_info'::regclass;
```

5. Click **Run** or press `Ctrl+Enter`
6. Check the results to verify all columns were added

### Option 2: Use the SQL file

Run the SQL file directly:
```bash
# The SQL is in check-and-fix-system-info-schema.sql
# Copy its contents to Supabase SQL Editor
```

### Option 3: Recreate the table from scratch

If you want to start fresh (⚠️ this will delete existing data):

```sql
-- Drop the existing table
DROP TABLE IF EXISTS system_info CASCADE;

-- Create the table with correct schema
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

-- Create index
CREATE INDEX idx_system_info_pc_name ON system_info(pc_name);

-- Enable RLS
ALTER TABLE system_info ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on system_info" ON system_info FOR ALL USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_system_info_updated_at BEFORE UPDATE ON system_info 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Verification

After running the SQL, restart your server:
```bash
node server/server.js
```

You should see:
```
✅ System info upserted for [PC_NAME]
```

Instead of the error message.

## Files Created

- `check-and-fix-system-info-schema.sql` - SQL script to add missing columns
- `fix-supabase-schema.js` - Node.js helper script (informational)
- `FIX-SUPABASE-SCHEMA.md` - This guide