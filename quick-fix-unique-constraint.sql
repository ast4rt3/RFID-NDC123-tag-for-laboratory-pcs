-- QUICK FIX: Add UNIQUE constraint on pc_name column
-- This is required for the upsert operation to work

-- Add UNIQUE constraint on pc_name
ALTER TABLE system_info ADD CONSTRAINT system_info_pc_name_key UNIQUE (pc_name);

-- Verify the constraint was added
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'system_info'::regclass;