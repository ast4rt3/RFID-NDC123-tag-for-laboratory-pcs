const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const fs = require('fs');

function log(message) {
    console.log(message);
    fs.appendFileSync('verify_output.txt', message + '\n');
}

async function verifyTable() {
    fs.writeFileSync('verify_output.txt', 'Starting verification...\n');
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        log('❌ Missing Supabase credentials.');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    log('🔍 Checking disk_storage table...');

    const { data, error } = await supabase
        .from('disk_storage')
        .select('*')
        .limit(1);

    if (error) {
        log('❌ Error accessing disk_storage table: ' + error.message);
        log('Details: ' + JSON.stringify(error));
    } else {
        log('✅ disk_storage table is accessible.');
        log('Data sample: ' + JSON.stringify(data));
    }
}

verifyTable();
