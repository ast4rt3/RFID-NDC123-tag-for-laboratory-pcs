const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupSupabaseTables() {
  console.log('🔧 Setting up Supabase tables...');
  
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  
  // SQL for creating tables
  const createTablesSQL = `
    -- Time Logs Table
    create table if not exists time_logs (
      id bigint primary key generated always as identity,
      pc_name text not null,
      start_time timestamp with time zone not null,
      end_time timestamp with time zone not null,
      duration_seconds integer not null,
      created_at timestamp with time zone default timezone('utc'::text, now())
    );

    -- App Usage Logs Table
    create table if not exists app_usage_logs (
      id bigint primary key generated always as identity,
      pc_name text not null,
      app_name text not null,
      start_time timestamp with time zone not null,
      end_time timestamp with time zone not null,
      duration_seconds integer not null,
      memory_usage_bytes bigint,
      cpu_percent real,
      gpu_percent real,
      created_at timestamp with time zone default timezone('utc'::text, now())
    );

    -- Add indexes
    create index if not exists idx_time_logs_pc_name on time_logs(pc_name);
    create index if not exists idx_time_logs_start_time on time_logs(start_time);
    create index if not exists idx_app_usage_logs_pc_name on app_usage_logs(pc_name);
    create index if not exists idx_app_usage_logs_start_time on app_usage_logs(start_time);
  `;
  
  console.log('Please execute this SQL in your Supabase SQL Editor:');
  console.log(createTablesSQL);
  console.log('\nAfter executing the SQL, run the check-supabase.js script again to verify the tables.');
}

setupSupabaseTables();