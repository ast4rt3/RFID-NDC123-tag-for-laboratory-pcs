const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applySchema() {
    console.log('🔧 Applying disk schema changes...\n');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const files = [
        'add_disk_models_to_system_info.sql',
        'create_disk_storage.sql'
    ];

    for (const file of files) {
        console.log(`📄 Processing ${file}...`);
        const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');

        // Try to execute via RPC (if exec_sql function exists)
        const { error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.warn(`⚠️ Could not execute ${file} via RPC:`, error.message);
            console.log('📋 Please run this SQL in your Supabase SQL Editor:\n');
            console.log('---------------------------------------------------');
            console.log(sql);
            console.log('---------------------------------------------------\n');
        } else {
            console.log(`✅ Successfully executed ${file}`);
        }
    }
}

applySchema().catch(console.error);
