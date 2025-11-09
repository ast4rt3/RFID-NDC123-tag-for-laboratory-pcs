-- ⚠️ SAFE VERSION: Check data before wiping
-- This script shows you what will be deleted before actually deleting it
-- 
-- Step 1: Run this to see current data counts
SELECT 'time_logs' as table_name, COUNT(*) as row_count FROM time_logs
UNION ALL
SELECT 'app_usage_logs', COUNT(*) FROM app_usage_logs
UNION ALL
SELECT 'browser_search_logs', COUNT(*) FROM browser_search_logs
UNION ALL
SELECT 'system_info', COUNT(*) FROM system_info;

-- Step 2: Review the counts above
-- Step 3: If you're sure you want to delete, uncomment and run the lines below

/*
-- ⚠️ UNCOMMENT BELOW TO ACTUALLY DELETE DATA ⚠️

-- Delete all data from time_logs
DELETE FROM time_logs;

-- Delete all data from app_usage_logs
DELETE FROM app_usage_logs;

-- Delete all data from browser_search_logs
DELETE FROM browser_search_logs;

-- Delete all data from system_info
DELETE FROM system_info;

-- Reset sequences (optional - resets auto-increment IDs back to 1)
ALTER SEQUENCE time_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE app_usage_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE browser_search_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE system_info_id_seq RESTART WITH 1;

-- Verify all tables are empty
SELECT 'time_logs' as table_name, COUNT(*) as row_count FROM time_logs
UNION ALL
SELECT 'app_usage_logs', COUNT(*) FROM app_usage_logs
UNION ALL
SELECT 'browser_search_logs', COUNT(*) FROM browser_search_logs
UNION ALL
SELECT 'system_info', COUNT(*) FROM system_info;
*/