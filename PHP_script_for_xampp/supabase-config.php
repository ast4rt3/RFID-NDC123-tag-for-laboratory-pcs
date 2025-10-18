<?php
// Supabase configuration for PHP
// Replace these with your actual Supabase credentials
$supabaseUrl = 'https://your-project-id.supabase.co';
$supabaseKey = 'your-anon-key-here';

// Alternative: Use environment variables if set
if (isset($_ENV['SUPABASE_URL'])) {
    $supabaseUrl = $_ENV['SUPABASE_URL'];
}
if (isset($_ENV['SUPABASE_ANON_KEY'])) {
    $supabaseKey = $_ENV['SUPABASE_ANON_KEY'];
}

// Function to make Supabase API calls
function supabaseQuery($table, $params = []) {
    global $supabaseUrl, $supabaseKey;
    
    $url = $supabaseUrl . '/rest/v1/' . $table;
    
    // Add query parameters
    if (!empty($params)) {
        $queryString = http_build_query($params);
        $url .= '?' . $queryString;
    }
    
    $headers = [
        'apikey: ' . $supabaseKey,
        'Authorization: Bearer ' . $supabaseKey,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        error_log("Supabase API error: HTTP $httpCode - $response");
        return false;
    }
    
    return json_decode($response, true);
}

// Function to get app usage data
function getAppUsageData($pcName, $selectedDate) {
    $params = [
        'pc_name' => 'eq.' . $pcName,
        'start_time' => 'gte.' . $selectedDate . 'T00:00:00',
        'start_time' => 'lte.' . $selectedDate . 'T23:59:59',
        'order' => 'start_time.desc'
    ];
    
    return supabaseQuery('app_usage_logs', $params);
}

// Function to get browser search data
function getBrowserSearchData($pcName, $selectedDate) {
    $params = [
        'pc_name' => 'eq.' . $pcName,
        'timestamp' => 'gte.' . $selectedDate . 'T00:00:00',
        'timestamp' => 'lte.' . $selectedDate . 'T23:59:59',
        'order' => 'timestamp.desc'
    ];
    
    return supabaseQuery('browser_search_logs', $params);
}

// Function to get available dates
function getAvailableDates($pcName) {
    // Get dates from app_usage_logs
    $appDates = supabaseQuery('app_usage_logs', [
        'pc_name' => 'eq.' . $pcName,
        'select' => 'start_time'
    ]);
    
    // Get dates from browser_search_logs
    $searchDates = supabaseQuery('browser_search_logs', [
        'pc_name' => 'eq.' . $pcName,
        'select' => 'timestamp'
    ]);
    
    $dates = [];
    
    if ($appDates) {
        foreach ($appDates as $row) {
            $date = date('Y-m-d', strtotime($row['start_time']));
            if (!in_array($date, $dates)) {
                $dates[] = $date;
            }
        }
    }
    
    if ($searchDates) {
        foreach ($searchDates as $row) {
            $date = date('Y-m-d', strtotime($row['timestamp']));
            if (!in_array($date, $dates)) {
                $dates[] = $date;
            }
        }
    }
    
    rsort($dates); // Sort descending
    return $dates;
}

// Function to get summary statistics
function getSummaryStats($pcName, $selectedDate) {
    $appStats = supabaseQuery('app_usage_logs', [
        'pc_name' => 'eq.' . $pcName,
        'start_time' => 'gte.' . $selectedDate . 'T00:00:00',
        'start_time' => 'lte.' . $selectedDate . 'T23:59:59',
        'select' => 'duration_seconds,memory_usage_bytes,cpu_percent'
    ]);
    
    $searchStats = supabaseQuery('browser_search_logs', [
        'pc_name' => 'eq.' . $pcName,
        'timestamp' => 'gte.' . $selectedDate . 'T00:00:00',
        'timestamp' => 'lte.' . $selectedDate . 'T23:59:59',
        'select' => 'search_query,search_engine'
    ]);
    
    return [
        'appStats' => $appStats ?: [],
        'searchStats' => $searchStats ?: []
    ];
}
?>
