-- Create temperature_logs table
CREATE TABLE IF NOT EXISTS temperature_logs (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL,
    cpu_temperature REAL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_temperature_logs_pc_name ON temperature_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_created_at ON temperature_logs(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for RLS
CREATE POLICY "Allow all operations on temperature_logs" ON temperature_logs FOR ALL USING (true);
