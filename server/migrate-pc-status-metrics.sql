-- Add CPU and RAM usage columns to pc_status table

ALTER TABLE pc_status 
ADD COLUMN IF NOT EXISTS cpu_usage_percent REAL,
ADD COLUMN IF NOT EXISTS ram_usage_percent REAL;

-- Comment on columns
COMMENT ON COLUMN pc_status.cpu_usage_percent IS 'Current CPU utilization percentage (0-100)';
COMMENT ON COLUMN pc_status.ram_usage_percent IS 'Current RAM usage percentage (0-100)';
