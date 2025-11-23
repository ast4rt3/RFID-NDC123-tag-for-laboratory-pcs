-- Create browser_search_logs table
CREATE TABLE IF NOT EXISTS browser_search_logs (
    id SERIAL PRIMARY KEY,
    pc_name VARCHAR(50) NOT NULL,
    browser VARCHAR(50) NOT NULL,
    url TEXT,
    search_query TEXT,
    search_engine VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_browser_search UNIQUE (pc_name, browser, url, timestamp)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_browser_search_logs_pc_name ON browser_search_logs(pc_name);
CREATE INDEX IF NOT EXISTS idx_browser_search_logs_timestamp ON browser_search_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_browser_search_logs_search_engine ON browser_search_logs(search_engine);

-- Enable Row Level Security (RLS)
ALTER TABLE browser_search_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for production)
CREATE POLICY "Allow all operations on browser_search_logs" ON browser_search_logs FOR ALL USING (true);

-- Create trigger for updated_at (assuming the function update_updated_at_column already exists)
-- If the function doesn't exist, you might need to create it first, but usually it does.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_browser_search_logs_updated_at') THEN
        CREATE TRIGGER update_browser_search_logs_updated_at BEFORE UPDATE ON browser_search_logs
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
