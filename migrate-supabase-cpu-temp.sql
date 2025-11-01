-- Migration: Add hardware monitoring columns to app_usage_logs table
-- Run this in Supabase SQL Editor

-- Add cpu_temperature column if it doesn't exist
ALTER TABLE app_usage_logs
ADD COLUMN IF NOT EXISTS cpu_temperature REAL;

-- Add is_cpu_overclocked column if it doesn't exist
ALTER TABLE app_usage_logs
ADD COLUMN IF NOT EXISTS is_cpu_overclocked BOOLEAN;

-- Add is_ram_overclocked column if it doesn't exist
ALTER TABLE app_usage_logs
ADD COLUMN IF NOT EXISTS is_ram_overclocked BOOLEAN;

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'app_usage_logs'
ORDER BY ordinal_position;

