-- Create table for disk storage (volumes)
CREATE TABLE IF NOT EXISTS disk_storage (
  pc_name TEXT NOT NULL,
  mount_point TEXT NOT NULL,
  total_gb NUMERIC,
  used_gb NUMERIC,
  available_gb NUMERIC,
  use_percent NUMERIC,
  label TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (pc_name, mount_point)
);

-- Enable RLS but allow all access for now (internal tool)
ALTER TABLE disk_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous access" ON disk_storage
  FOR ALL USING (true) WITH CHECK (true);
