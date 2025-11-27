-- Add disk_models column to system_info table
ALTER TABLE system_info ADD COLUMN IF NOT EXISTS disk_models TEXT;
