// Supabase configuration for RFID monitoring system
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Database operations wrapper
class SupabaseDB {
  constructor() {
    this.client = supabase;
  }

  // Test connection
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('time_logs')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
      }
      
      console.log('✅ Connected to Supabase successfully');
      return true;
    } catch (err) {
      console.error('❌ Supabase connection error:', err.message);
      return false;
    }
  }

  // Insert time log
  async insertTimeLog(pcName, startTime, endTime, duration) {
    const { data, error } = await this.client
      .from('time_logs')
      .insert({
        pc_name: pcName,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: duration
      })
      .select();

    if (error) {
      console.error('❌ Error inserting time log:', error.message);
      return false;
    }
    
    console.log('✅ Time log saved:', data[0]);
    return true;
  }

  // Insert app usage log
  async insertAppUsageLog(pcName, appName, startTime, endTime, duration, memoryUsage, cpuPercent, gpuPercent) {
    const { data, error } = await this.client
      .from('app_usage_logs')
      .upsert({
        pc_name: pcName,
        app_name: appName,
        start_time: startTime,
        end_time: endTime,
        duration_seconds: duration,
        memory_usage_bytes: memoryUsage,
        cpu_percent: cpuPercent,
        gpu_percent: gpuPercent
      }, {
        onConflict: 'pc_name,app_name,start_time'
      })
      .select();

    if (error) {
      console.error('❌ Error inserting app usage log:', error.message);
      return false;
    }
    
    console.log('✅ App usage log saved:', data[0]);
    return true;
  }

  // Insert browser search log
  async insertBrowserSearchLog(pcName, browser, url, searchQuery, searchEngine, timestamp) {
    const { data, error } = await this.client
      .from('browser_search_logs')
      .upsert({
        pc_name: pcName,
        browser: browser,
        url: url,
        search_query: searchQuery,
        search_engine: searchEngine,
        timestamp: timestamp
      }, {
        onConflict: 'pc_name,browser,url,timestamp'
      })
      .select();

    if (error) {
      console.error('❌ Error inserting browser search log:', error.message);
      return false;
    }
    
    console.log('✅ Browser search log saved:', data[0]);
    return true;
  }

  // Get time logs
  async getTimeLogs(limit = 100) {
    const { data, error } = await this.client
      .from('time_logs')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error fetching time logs:', error.message);
      return [];
    }

    return data;
  }

  // Get browser logs with filters
  async getBrowserLogs(pcName = null, searchEngine = null, limit = 100) {
    let query = this.client
      .from('browser_search_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (pcName) {
      query = query.eq('pc_name', pcName);
    }

    if (searchEngine) {
      query = query.eq('search_engine', searchEngine);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching browser logs:', error.message);
      return [];
    }

    return data;
  }

  // Get app usage data for specific PC and date
  async getAppUsageData(pcName, selectedDate) {
    const { data, error } = await this.client
      .from('app_usage_logs')
      .select('*')
      .eq('pc_name', pcName)
      .gte('start_time', `${selectedDate} 00:00:00`)
      .lte('start_time', `${selectedDate} 23:59:59`)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('❌ Error fetching app usage data:', error.message);
      return [];
    }

    return data;
  }

  // Get browser search data for specific PC and date
  async getBrowserSearchData(pcName, selectedDate) {
    const { data, error } = await this.client
      .from('browser_search_logs')
      .select('*')
      .eq('pc_name', pcName)
      .gte('timestamp', `${selectedDate} 00:00:00`)
      .lte('timestamp', `${selectedDate} 23:59:59`)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Error fetching browser search data:', error.message);
      return [];
    }

    return data;
  }

  // Get summary statistics
  async getSummaryStats(pcName, selectedDate) {
    // Get app usage stats
    const { data: appStats, error: appError } = await this.client
      .from('app_usage_logs')
      .select('duration_seconds, memory_usage_bytes, cpu_percent')
      .eq('pc_name', pcName)
      .gte('start_time', `${selectedDate} 00:00:00`)
      .lte('start_time', `${selectedDate} 23:59:59`);

    // Get browser search stats
    const { data: searchStats, error: searchError } = await this.client
      .from('browser_search_logs')
      .select('search_query, search_engine')
      .eq('pc_name', pcName)
      .gte('timestamp', `${selectedDate} 00:00:00`)
      .lte('timestamp', `${selectedDate} 23:59:59`);

    if (appError || searchError) {
      console.error('❌ Error fetching summary stats:', appError?.message || searchError?.message);
      return null;
    }

    return {
      appStats: appStats || [],
      searchStats: searchStats || []
    };
  }
}

module.exports = SupabaseDB;
