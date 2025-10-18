#!/usr/bin/env node

/**
 * Simple Supabase Migration Script
 * Migrates data from local MySQL to Supabase
 */

const mysql = require('mysql2');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🚀 Starting Supabase migration...');

// MySQL source
const mysqlDb = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'juglone',
  port: 3306
});

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Test connections
mysqlDb.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL');
});

// Migration function
async function migrateData() {
  try {
    console.log('📊 Migrating time_logs...');
    
    // Get time_logs data
    mysqlDb.query('SELECT * FROM time_logs', async (err, rows) => {
      if (err) {
        console.error('❌ Error reading time_logs:', err.message);
        return;
      }
      
      if (rows.length > 0) {
        const { data, error } = await supabase
          .from('time_logs')
          .insert(rows.map(row => ({
            pc_name: row.pc_name,
            start_time: row.start_time,
            end_time: row.end_time,
            duration_seconds: row.duration_seconds
          })));
          
        if (error) {
          console.error('❌ Error inserting time_logs:', error.message);
        } else {
          console.log(`✅ Migrated ${rows.length} time_logs`);
        }
      }
      
      // Migrate app_usage_logs
      console.log('📊 Migrating app_usage_logs...');
      mysqlDb.query('SELECT * FROM app_usage_logs', async (err, rows) => {
        if (err) {
          console.error('❌ Error reading app_usage_logs:', err.message);
          return;
        }
        
        if (rows.length > 0) {
          const { data, error } = await supabase
            .from('app_usage_logs')
            .insert(rows.map(row => ({
              pc_name: row.pc_name,
              app_name: row.app_name,
              start_time: row.start_time,
              end_time: row.end_time,
              duration_seconds: row.duration_seconds,
              memory_usage_bytes: row.memory_usage_bytes,
              cpu_percent: row.cpu_percent,
              gpu_percent: row.gpu_percent
            })));
            
          if (error) {
            console.error('❌ Error inserting app_usage_logs:', error.message);
          } else {
            console.log(`✅ Migrated ${rows.length} app_usage_logs`);
          }
        }
        
        // Migrate browser_search_logs
        console.log('📊 Migrating browser_search_logs...');
        mysqlDb.query('SELECT * FROM browser_search_logs', async (err, rows) => {
          if (err) {
            console.error('❌ Error reading browser_search_logs:', err.message);
            return;
          }
          
          if (rows.length > 0) {
            const { data, error } = await supabase
              .from('browser_search_logs')
              .insert(rows.map(row => ({
                pc_name: row.pc_name,
                browser: row.browser,
                url: row.url,
                search_query: row.search_query,
                search_engine: row.search_engine,
                timestamp: row.timestamp
              })));
              
            if (error) {
              console.error('❌ Error inserting browser_search_logs:', error.message);
            } else {
              console.log(`✅ Migrated ${rows.length} browser_search_logs`);
            }
          }
          
          console.log('🎉 Migration completed!');
          mysqlDb.end();
          process.exit(0);
        });
      });
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    mysqlDb.end();
    process.exit(1);
  }
}

// Run migration
migrateData();
