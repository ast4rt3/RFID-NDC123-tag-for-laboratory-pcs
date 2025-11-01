const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSupabaseTables() {
  console.log('🔍 Checking Supabase configuration...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Key exists:', !!process.env.SUPABASE_ANON_KEY);

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    
    // Check time_logs table
    const { data: timeLogs, error: timeLogsError } = await supabase
      .from('time_logs')
      .select('id')
      .limit(1);
      
    if (timeLogsError) {
      console.error('❌ time_logs table error:', timeLogsError.message);
    } else {
      console.log('✅ time_logs table exists');
    }
    
    // Check app_usage_logs table
    const { data: appLogs, error: appLogsError } = await supabase
      .from('app_usage_logs')
      .select('id')
      .limit(1);
      
    if (appLogsError) {
      console.error('❌ app_usage_logs table error:', appLogsError.message);
    } else {
      console.log('✅ app_usage_logs table exists');
    }
    
  } catch (err) {
    console.error('❌ Supabase connection error:', err.message);
  }
}

checkSupabaseTables();