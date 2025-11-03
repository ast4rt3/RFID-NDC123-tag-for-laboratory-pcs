const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixSupabaseSchema() {
  console.log('🔧 Checking and fixing Supabase system_info table schema...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // SQL to check current schema
  const checkSchemaSQL = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'system_info'
    ORDER BY ordinal_position;
  `;

  console.log('📊 Current system_info table schema:');
  const { data: currentSchema, error: schemaError } = await supabase.rpc('exec_sql', { 
    sql: checkSchemaSQL 
  });

  if (schemaError) {
    console.log('⚠️ Could not check schema via RPC. You need to run the SQL manually.');
    console.log('\n📋 Please run this SQL in your Supabase SQL Editor:\n');
    console.log(getFixSchemaSQL());
    return;
  }

  if (currentSchema) {
    console.table(currentSchema);
  }

  console.log('\n📋 To fix the schema, run this SQL in your Supabase SQL Editor:\n');
  console.log(getFixSchemaSQL());
}

function getFixSchemaSQL() {
  return `
-- Add missing columns to system_info table
DO $$
BEGIN
    -- Add cpu_model if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'cpu_model') THEN
        ALTER TABLE system_info ADD COLUMN cpu_model VARCHAR(200);
    END IF;

    -- Add cpu_cores if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'cpu_cores') THEN
        ALTER TABLE system_info ADD COLUMN cpu_cores INTEGER;
    END IF;

    -- Add cpu_speed_ghz if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'cpu_speed_ghz') THEN
        ALTER TABLE system_info ADD COLUMN cpu_speed_ghz REAL;
    END IF;

    -- Add total_memory_gb if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'total_memory_gb') THEN
        ALTER TABLE system_info ADD COLUMN total_memory_gb REAL;
    END IF;

    -- Add os_platform if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'os_platform') THEN
        ALTER TABLE system_info ADD COLUMN os_platform VARCHAR(50);
    END IF;

    -- Add os_version if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'os_version') THEN
        ALTER TABLE system_info ADD COLUMN os_version VARCHAR(100);
    END IF;

    -- Add hostname if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'hostname') THEN
        ALTER TABLE system_info ADD COLUMN hostname VARCHAR(100);
    END IF;

    -- Add created_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE system_info ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
    END IF;

    -- Add updated_at if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'system_info' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE system_info ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
    END IF;
END $$;
`;
}

fixSupabaseSchema().catch(console.error);