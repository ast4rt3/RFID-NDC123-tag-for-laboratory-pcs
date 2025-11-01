#!/usr/bin/env node

/**
 * Supabase Reset and Setup Script
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🚀 Starting Supabase reset and setup...');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY);

async function resetAndSetupSupabase() {
  try {
    // Delete all data from existing tables
    console.log('🗑️ Clearing existing data...');
    
    await supabase.from('time_logs').delete().neq('id', 0);
    await supabase.from('app_usage_logs').delete().neq('id', 0);
    
    console.log('✅ Existing data cleared');

    // Create or update tables (using RPC calls for table creation if needed)
    console.log('📊 Verifying table structure...');

    // You might need to use database policies and RLS here
    // This is just a basic example
    const timeLogs = await supabase
      .from('time_logs')
      .select('id')
      .limit(1);

    const appUsageLogs = await supabase
      .from('app_usage_logs')
      .select('id')
      .limit(1);

    if (timeLogs.error || appUsageLogs.error) {
      console.log('⚠️ Tables need to be created. Please run the following SQL in Supabase SQL editor:');
      console.log(`
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
      `);
    } else {
      console.log('✅ Tables verified');
    }

    console.log('🎉 Supabase reset and setup completed!');
  } catch (error) {
    console.error('❌ Reset and setup failed:', error.message);
    process.exit(1);
  }
}

// Run reset and setup
resetAndSetupSupabase();