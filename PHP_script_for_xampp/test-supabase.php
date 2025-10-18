<?php
// Test Supabase connection
require_once 'supabase-config.php';

echo "<h1>Supabase Connection Test</h1>";

// Test connection by trying to fetch data
$testData = supabaseQuery('time_logs', ['limit' => 1]);

if ($testData !== false) {
    echo "<p style='color: green;'>✅ Supabase connection successful!</p>";
    echo "<p>Found " . count($testData) . " records in time_logs table.</p>";
    
    if (count($testData) > 0) {
        echo "<h3>Sample Data:</h3>";
        echo "<pre>" . print_r($testData[0], true) . "</pre>";
    } else {
        echo "<p>No data found. This is normal for a new database.</p>";
    }
} else {
    echo "<p style='color: red;'>❌ Supabase connection failed!</p>";
    echo "<p>Please check your credentials in supabase-config.php</p>";
}

echo "<hr>";
echo "<h3>Available Tables Test:</h3>";

// Test each table
$tables = ['time_logs', 'app_usage_logs', 'browser_search_logs'];

foreach ($tables as $table) {
    $data = supabaseQuery($table, ['limit' => 1]);
    if ($data !== false) {
        echo "<p style='color: green;'>✅ Table '$table' accessible</p>";
    } else {
        echo "<p style='color: red;'>❌ Table '$table' not accessible</p>";
    }
}
?>
