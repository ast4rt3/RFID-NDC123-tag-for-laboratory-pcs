-- ⚠️ WARNING: This will DELETE ALL DATA from all tables!
-- Use with caution. This action cannot be undone.
-- 
-- Run this in Supabase SQL Editor to wipe all data

-- Delete all data from time_logs
DELETE FROM time_logs;

-- Delete all data from app_usage_logs
DELETE FROM app_usage_logs;

-- Delete all data from browser_search_logs (if exists)
DELETE FROM browser_search_logs;

-- Delete all data from system_info (if exists)
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

-- Expected output: All tables should show 0 rows