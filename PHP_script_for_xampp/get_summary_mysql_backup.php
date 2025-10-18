<?php
$host = "localhost";
$user = "root";
$pass = "";
$db = "juglone";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$pcName = $_GET['pc_name'] ?? '';
$selectedDate = $_GET['date'] ?? date('Y-m-d');

$tab = $_GET['tab'] ?? 'apps'; // New tab parameter for switching views

$appData = [];
$appChartData = [];
$searchData = [];
$searchChartData = [];
$dates = [];

$summaryStats = [];

if ($pcName) {

    // Fetch available dates for dropdown (from both tables)
    $dateQuery = $conn->prepare("
        SELECT DISTINCT log_date FROM (
            SELECT DATE(start_time) as log_date FROM app_usage_logs WHERE pc_name = ?
            UNION
            SELECT DATE(timestamp) as log_date FROM browser_search_logs WHERE pc_name = ?
        ) combined_dates 
        ORDER BY log_date DESC
    ");
    $dateQuery->bind_param("ss", $pcName, $pcName);
    $dateQuery->execute();
    $dateResult = $dateQuery->get_result();
    while ($row = $dateResult->fetch_assoc()) {
        $dates[] = $row['log_date'];
    }


    // App usage data for selected date
    $appStmt = $conn->prepare("SELECT start_time, end_time, duration_seconds, app_name, memory_usage_bytes, cpu_percent, gpu_percent FROM app_usage_logs WHERE pc_name = ? AND DATE(start_time) = ? ORDER BY start_time DESC");
    $appStmt->bind_param("ss", $pcName, $selectedDate);
    $appStmt->execute();
    $appResult = $appStmt->get_result();
    while ($row = $appResult->fetch_assoc()) {
        $appData[] = $row;
    }

    // App usage chart data
    $appChartStmt = $conn->prepare("SELECT app_name, SUM(duration_seconds) AS total_duration FROM app_usage_logs WHERE pc_name = ? AND DATE(start_time) = ? GROUP BY app_name ORDER BY total_duration DESC");
    $appChartStmt->bind_param("ss", $pcName, $selectedDate);
    $appChartStmt->execute();
    $appChartResult = $appChartStmt->get_result();
    while ($row = $appChartResult->fetch_assoc()) {
        $appChartData[] = $row;
    }

    // Browser search data for selected date
    $searchStmt = $conn->prepare("SELECT browser, url, search_query, search_engine, timestamp FROM browser_search_logs WHERE pc_name = ? AND DATE(timestamp) = ? ORDER BY timestamp DESC");
    $searchStmt->bind_param("ss", $pcName, $selectedDate);
    $searchStmt->execute();
    $searchResult = $searchStmt->get_result();
    while ($row = $searchResult->fetch_assoc()) {
        $searchData[] = $row;
    }

    // Browser search chart data
    $searchChartStmt = $conn->prepare("SELECT search_engine, COUNT(*) AS search_count FROM browser_search_logs WHERE pc_name = ? AND DATE(timestamp) = ? AND search_engine IS NOT NULL GROUP BY search_engine ORDER BY search_count DESC");
    $searchChartStmt->bind_param("ss", $pcName, $selectedDate);
    $searchChartStmt->execute();
    $searchChartResult = $searchChartStmt->get_result();
    while ($row = $searchChartResult->fetch_assoc()) {
        $searchChartData[] = $row;
    }

    // Summary statistics
    $summaryStmt = $conn->prepare("
        SELECT 
            (SELECT COUNT(*) FROM app_usage_logs WHERE pc_name = ? AND DATE(start_time) = ?) as app_sessions,
            (SELECT SUM(duration_seconds) FROM app_usage_logs WHERE pc_name = ? AND DATE(start_time) = ?) as total_app_time,
            (SELECT COUNT(*) FROM browser_search_logs WHERE pc_name = ? AND DATE(timestamp) = ?) as total_searches,
            (SELECT COUNT(DISTINCT search_engine) FROM browser_search_logs WHERE pc_name = ? AND DATE(timestamp) = ? AND search_engine IS NOT NULL) as unique_engines,
            (SELECT COUNT(*) FROM browser_search_logs WHERE pc_name = ? AND DATE(timestamp) = ? AND search_query IS NOT NULL AND search_query != '' AND search_query != 'N/A') as actual_queries
    ");
    $summaryStmt->bind_param("ssssssssss", $pcName, $selectedDate, $pcName, $selectedDate, $pcName, $selectedDate, $pcName, $selectedDate, $pcName, $selectedDate);
    $summaryStmt->execute();
    $summaryResult = $summaryStmt->get_result();
    $summaryStats = $summaryResult->fetch_assoc();
}
?>
<!DOCTYPE html>

<html lang="en">
<head>

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RFID Laboratory Monitor - <?= htmlspecialchars($pcName) ?></title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .controls {
            padding: 30px;
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
        }

        .control-group {
            display: flex;
            gap: 20px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: center;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .form-group label {
            font-weight: 600;
            color: #374151;
            font-size: 0.9rem;
        }

        select {
            padding: 12px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 10px;
            font-size: 1rem;
            background: white;
            transition: all 0.3s ease;
            min-width: 200px;
        }

        select:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: white;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }

        .stat-card:hover {
            transform: translateY(-5px);
        }

        .stat-card i {
            font-size: 2.5rem;
            margin-bottom: 15px;
            opacity: 0.9;
        }

        .stat-card .number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .stat-card .label {
            font-size: 0.9rem;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .tabs {
            display: flex;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
        }

        .tab {
            flex: 1;
            padding: 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
            background: none;
            font-size: 1rem;
            font-weight: 600;
            color: #64748b;
        }

        .tab.active {
            background: white;
            color: #4f46e5;
            border-bottom: 3px solid #4f46e5;
        }

        .tab:hover:not(.active) {
            background: #e2e8f0;
            color: #374151;
        }

        .tab-content {
            padding: 30px;
        }

        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            position: relative;
        }

        .chart-wrapper {
            position: relative;
            height: 400px;
            width: 100%;
            margin: 0 auto;
        }

        .chart-container canvas {
            max-height: 400px !important;
            max-width: 100% !important;
            width: 100% !important;
            height: 400px !important;
        }

        .chart-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 20px;
            text-align: center;
        }

        .data-table {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.9rem;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
            color: #374151;
        }

        tr:hover {
            background: #f8fafc;
        }

        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .badge-google { background: #4285f4; color: white; }
        .badge-bing { background: #0078d4; color: white; }
        .badge-yahoo { background: #6001d2; color: white; }
        .badge-duckduckgo { background: #de5833; color: white; }
        .badge-youtube { background: #ff0000; color: white; }
        .badge-chrome { background: #4285f4; color: white; }
        .badge-firefox { background: #ff7139; color: white; }
        .badge-edge { background: #0078d4; color: white; }
        .badge-brave { background: #fb542b; color: white; }

        .search-query {
            max-width: 400px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #64748b;
        }

        .empty-state i {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.5;
        }

        .empty-state h3 {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #374151;
        }

        /* Mobile-first responsive design */
        @media (max-width: 768px) {
            body {
                padding: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .container {
                margin: 0;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .header {
                padding: 20px 15px;
            }
            
            .header h1 {
                font-size: 1.8rem;
                margin-bottom: 8px;
            }
            
            .header .subtitle {
                font-size: 0.9rem;
            }
            
            .controls {
                padding: 20px 15px;
            }
            
            .control-group {
                flex-direction: column;
                align-items: stretch;
                gap: 15px;
            }
            
            .form-group label {
                font-size: 0.85rem;
            }
            
            select {
                min-width: auto;
                width: 100%;
                padding: 15px;
                font-size: 1.1rem;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                padding: 20px 15px;
            }
            
            .stat-card {
                padding: 20px 15px;
            }
            
            .stat-card i {
                font-size: 2rem;
                margin-bottom: 10px;
            }
            
            .stat-card .number {
                font-size: 1.5rem;
            }
            
            .stat-card .label {
                font-size: 0.8rem;
            }
            
            .tabs {
                flex-direction: row;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            .tab {
                min-width: 120px;
                padding: 15px 10px;
                font-size: 0.9rem;
                white-space: nowrap;
            }
            
            .tab-content {
                padding: 15px;
            }
            
            .chart-container {
                height: auto;
                min-height: 400px;
                padding: 20px 15px;
                margin-bottom: 20px;
            }
            
            .chart-wrapper {
                height: 300px;
            }
            
            .chart-container canvas {
                max-height: 300px !important;
                height: 300px !important;
            }
            
            .chart-title {
                font-size: 1.2rem;
                margin-bottom: 15px;
            }
            
            .data-table {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            table {
                min-width: 600px;
            }
            
            th, td {
                padding: 12px 8px;
                font-size: 0.85rem;
            }
            
            th {
                font-size: 0.75rem;
            }
            
            .badge {
                font-size: 0.7rem;
                padding: 3px 8px;
            }
            
            .search-query {
                max-width: 300px;
            }
            
            .empty-state {
                padding: 40px 15px;
            }
            
            .empty-state i {
                font-size: 3rem;
                margin-bottom: 15px;
            }
            
            .empty-state h3 {
                font-size: 1.2rem;
            }
        }

        /* Extra small devices */
        @media (max-width: 480px) {
            .stats-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .header h1 {
                font-size: 1.5rem;
            }
            
            .tab {
                min-width: 100px;
                padding: 12px 8px;
                font-size: 0.8rem;
            }
            
            .chart-container {
                padding: 15px 10px;
            }
            
            .chart-wrapper {
                height: 250px;
            }
            
            .chart-container canvas {
                max-height: 250px !important;
                height: 250px !important;
            }
        }

        /* Touch-friendly interactions */
        @media (hover: none) and (pointer: coarse) {
            .tab {
                padding: 20px 15px;
            }
            
            select {
                padding: 18px;
                font-size: 1.2rem;
            }
            
            .stat-card {
                padding: 25px 20px;
            }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            }
            
            .container {
                background: #2d3748;
                color: #e2e8f0;
            }
            
            .controls {
                background: #1a202c;
                border-bottom-color: #4a5568;
            }
            
            .form-group label {
                color: #e2e8f0;
            }
            
            select {
                background: #2d3748;
                border-color: #4a5568;
                color: #e2e8f0;
            }
            
            select:focus {
                border-color: #4f46e5;
            }
            
            .tab {
                color: #a0aec0;
            }
            
            .tab.active {
                background: #2d3748;
                color: #4f46e5;
            }
            
            .tab:hover:not(.active) {
                background: #4a5568;
                color: #e2e8f0;
            }
            
            .chart-container {
                background: #2d3748;
            }
            
            .data-table {
                background: #2d3748;
            }
            
            td {
                color: #e2e8f0;
                border-bottom-color: #4a5568;
            }
            
            tr:hover {
                background: #4a5568;
            }
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="header">
            <h1><i class="fas fa-desktop"></i> RFID Laboratory Monitor</h1>
            <div class="subtitle">PC: <?= htmlspecialchars($pcName) ?> • <?= $selectedDate ?></div>
        </div>

        <?php if ($pcName): ?>
        <div class="controls">
            <form method="get" class="control-group">
        <input type="hidden" name="pc_name" value="<?= htmlspecialchars($pcName) ?>">

                <input type="hidden" name="tab" value="<?= $tab ?>">
                <div class="form-group">
                    <label for="date"><i class="fas fa-calendar"></i> Select Date</label>
        <select name="date" id="date" onchange="this.form.submit()">
            <?php foreach ($dates as $date): ?>

                            <option value="<?= $date ?>" <?= $date == $selectedDate ? 'selected' : '' ?>><?= date('M d, Y', strtotime($date)) ?></option>
            <?php endforeach; ?>
        </select>

                </div>
    </form>

        </div>

        <!-- Summary Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <i class="fas fa-desktop"></i>
                <div class="number"><?= $summaryStats['app_sessions'] ?? 0 ?></div>
                <div class="label">App Sessions</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-clock"></i>
                <div class="number"><?= round(($summaryStats['total_app_time'] ?? 0) / 3600, 1) ?>h</div>
                <div class="label">Total Usage</div>
            </div>
            <div class="stat-card" title="Actual search queries detected (<?= $summaryStats['total_searches'] ?? 0 ?> total browser activities)">
                <i class="fas fa-search"></i>
                <div class="number"><?= $summaryStats['actual_queries'] ?? 0 ?></div>
                <div class="label">Search Queries</div>
                <div style="font-size: 0.7rem; opacity: 0.8; margin-top: 5px;">
                    (<?= $summaryStats['total_searches'] ?? 0 ?> browser activities)
                </div>
            </div>
            <div class="stat-card">
                <i class="fas fa-globe"></i>
                <div class="number"><?= $summaryStats['unique_engines'] ?? 0 ?></div>
                <div class="label">Search Engines</div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
            <button class="tab <?= $tab === 'apps' ? 'active' : '' ?>" onclick="switchTab('apps')">
                <i class="fas fa-desktop"></i> App Usage
            </button>
            <button class="tab <?= $tab === 'searches' ? 'active' : '' ?>" onclick="switchTab('searches')">
                <i class="fas fa-search"></i> Search Activity
            </button>
        </div>

        <!-- App Usage Tab -->
        <div id="apps-tab" class="tab-content" style="display: <?= $tab === 'apps' ? 'block' : 'none' ?>">
            <div class="chart-container">
                <div class="chart-title"><i class="fas fa-chart-bar"></i> App Usage Distribution</div>
                <div class="chart-wrapper">
                    <canvas id="appUsageChart"></canvas>
                </div>
            </div>

            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th><i class="fas fa-desktop"></i> Application</th>
                            <th><i class="fas fa-play"></i> Start Time</th>
                            <th><i class="fas fa-stop"></i> End Time</th>
                            <th><i class="fas fa-clock"></i> Duration</th>
                            <th><i class="fas fa-memory"></i> Memory</th>
                            <th><i class="fas fa-microchip"></i> CPU</th>
                            <th><i class="fas fa-video"></i> GPU</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (empty($appData)): ?>
                            <tr>
                                <td colspan="7" class="empty-state">
                                    <i class="fas fa-desktop"></i>
                                    <h3>No App Usage Data</h3>
                                    <p>No application usage recorded for this date.</p>
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($appData as $entry): ?>
                                <tr>
                                    <td><strong><?= htmlspecialchars($entry['app_name']) ?></strong></td>
                                    <td><?= date('H:i:s', strtotime($entry['start_time'])) ?></td>
                                    <td><?= date('H:i:s', strtotime($entry['end_time'])) ?></td>
                                    <td><?= round($entry['duration_seconds'] / 60, 1) ?> min</td>
                                    <td><?= number_format($entry['memory_usage_bytes'] / 1048576, 1) ?> MB</td>
                                    <td><?= round($entry['cpu_percent'], 1) ?>%</td>
                                    <td><?= $entry['gpu_percent'] ? round($entry['gpu_percent'], 1) . '%' : 'N/A' ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Search Activity Tab -->
        <div id="searches-tab" class="tab-content" style="display: <?= $tab === 'searches' ? 'block' : 'none' ?>">
            <div class="chart-container">
                <div class="chart-title"><i class="fas fa-chart-pie"></i> Search Engine Distribution</div>
                <div class="chart-wrapper">
                    <canvas id="searchChart"></canvas>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #4f46e5;">
                <p style="margin: 0; color: #374151; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> 
                    <strong>Search Query</strong> field contains extracted search terms or browser window titles when search queries are detected.
                </p>
            </div>

            <div class="data-table">
    <table>
        <thead>
            <tr>

                            <th><i class="fas fa-globe"></i> Browser</th>
                            <th><i class="fas fa-search"></i> Search Query</th>
                            <th><i class="fas fa-external-link-alt"></i> Search Engine</th>
                            <th><i class="fas fa-clock"></i> Time</th>
            </tr>
        </thead>
        <tbody>

                        <?php if (empty($searchData)): ?>
                            <tr>
                                <td colspan="4" class="empty-state">
                                    <i class="fas fa-search"></i>
                                    <h3>No Search Activity</h3>
                                    <p>No search queries or browser activities recorded for this date.</p>
                                    <p style="font-size: 0.8rem; color: #64748b; margin-top: 10px;">
                                        <i class="fas fa-info-circle"></i> 
                                        Make sure the client application is running and browsers are being used.
                                    </p>
                                </td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($searchData as $entry): ?>
                                <tr>
                                    <td>
                                        <span class="badge badge-<?= strtolower($entry['browser']) ?>">
                                            <?= htmlspecialchars($entry['browser']) ?>
                                        </span>
                                    </td>
                                    <td class="search-query" title="<?= htmlspecialchars($entry['search_query'] ?? '') ?>">
                                        <?php 
                                        $searchQuery = $entry['search_query'] ?? 'N/A';
                                        if ($searchQuery === 'N/A') {
                                            echo '<span style="color: #64748b;">No search query detected</span>';
                                        } else {
                                            echo htmlspecialchars($searchQuery);
                                        }
                                        ?>
                                    </td>
                                    <td>
                                        <?php if ($entry['search_engine']): ?>
                                            <span class="badge badge-<?= strtolower($entry['search_engine']) ?>">
                                                <?= htmlspecialchars($entry['search_engine']) ?>
                                            </span>
                                        <?php else: ?>
                                            <span style="color: #64748b;">N/A</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?= date('H:i:s', strtotime($entry['timestamp'])) ?></td>
                </tr>
            <?php endforeach; ?>

                        <?php endif; ?>
        </tbody>
    </table>

            </div>
        </div>

        <?php else: ?>
        <div class="empty-state" style="padding: 100px 20px;">
            <i class="fas fa-desktop"></i>
            <h3>No PC Selected</h3>
            <p>Please select a PC to view monitoring data.</p>
        </div>
        <?php endif; ?>
    </div>

    <script>

        // Tab switching functionality
        function switchTab(tabName) {
            // Update URL without page reload
            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({}, '', url);
            
            // Update tab buttons
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
            
            // Show/hide tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabName}-tab`).style.display = 'block';
            
            // Reinitialize charts if needed
            if (tabName === 'apps') {
                initAppChart();
            } else if (tabName === 'searches') {
                initSearchChart();
            }
        }

        // App Usage Chart
        function initAppChart() {
            const appChartData = <?= json_encode($appChartData) ?>;
            
            if (!appChartData || appChartData.length === 0) {
                console.log('No app chart data available');
                return;
            }
            
            const appLabels = appChartData.map(item => item.app_name);
            const appDurations = appChartData.map(item => (item.total_duration / 60).toFixed(1));

            const appCtx = document.getElementById('appUsageChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (window.appChart) {
                window.appChart.destroy();
            }
            
            window.appChart = new Chart(appCtx, {
            type: 'bar',
            data: {

                    labels: appLabels,
                datasets: [{
                    label: 'Total Duration (minutes)',

                        data: appDurations,
                        backgroundColor: [
                            'rgba(79, 70, 229, 0.8)',
                            'rgba(124, 58, 237, 0.8)',
                            'rgba(168, 85, 247, 0.8)',
                            'rgba(196, 181, 253, 0.8)',
                            'rgba(221, 214, 254, 0.8)'
                        ],
                        borderColor: [
                            'rgba(79, 70, 229, 1)',
                            'rgba(124, 58, 237, 1)',
                            'rgba(168, 85, 247, 1)',
                            'rgba(196, 181, 253, 1)',
                            'rgba(221, 214, 254, 1)'
                        ],
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                devicePixelRatio: 1,
                plugins: {

                        legend: { 
                            display: false 
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(79, 70, 229, 1)',
                            borderWidth: 1,
                            cornerRadius: 8
                        }
                },
                scales: {
                    x: {

                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                        title: {
                            display: true,

                                text: 'Duration (minutes)',
                                color: '#374151',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                        }
                    },
                    y: {

                            grid: {
                                display: false
                            },
                        title: {
                            display: true,

                                text: 'Applications',
                                color: '#374151',
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                        }
                    }
                }
            }
        });
        }

        // Search Engine Chart
        function initSearchChart() {
            const searchChartData = <?= json_encode($searchChartData) ?>;
            
           
            
            const searchLabels = searchChartData.map(item => item.search_engine);
            const searchCounts = searchChartData.map(item => item.search_count);

            const searchCtx = document.getElementById('searchChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (window.searchChart) {
                window.searchChart.destroy();
            }
            
            window.searchChart = new Chart(searchCtx, {
                type: 'doughnut',
                data: {
                    labels: searchLabels,
                    datasets: [{
                        data: searchCounts,
                        backgroundColor: [
                            '#4285f4', // Google
                            '#0078d4', // Bing
                            '#6001d2', // Yahoo
                            '#de5833', // DuckDuckGo
                            '#ff0000', // YouTube
                            '#34a853', // Other
                            '#fbbc04'
                        ],
                        borderWidth: 3,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    devicePixelRatio: 1,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 12,
                                    weight: 'bold'
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            borderColor: 'rgba(79, 70, 229, 1)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return context.label + ': ' + context.parsed + ' searches (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    cutout: '60%'
                }
            });
        }

        // Initialize charts based on current tab
        document.addEventListener('DOMContentLoaded', function() {
            const currentTab = '<?= $tab ?>';
            if (currentTab === 'apps') {
                initAppChart();
            } else if (currentTab === 'searches') {
                initSearchChart();
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', function(event) {
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab') || 'apps';
            switchTab(tab);
        });

        // Mobile-specific enhancements
        document.addEventListener('DOMContentLoaded', function() {
            // Add touch gestures for mobile
            addTouchGestures();
            
            // Add loading states
            addLoadingStates();
            
            // Add pull-to-refresh (mobile)
            addPullToRefresh();
            
            // Add swipe navigation between tabs
            addSwipeNavigation();
            
            // Optimize for mobile performance
            optimizeForMobile();
        });

        function addTouchGestures() {
            let startX = 0;
            let startY = 0;
            
            document.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            });
            
            document.addEventListener('touchend', function(e) {
                if (!startX || !startY) return;
                
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                
                const diffX = startX - endX;
                const diffY = startY - endY;
                
                // Horizontal swipe (tab switching)
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                    const currentTab = document.querySelector('.tab.active').textContent.trim().toLowerCase();
                    if (diffX > 0 && currentTab.includes('app')) {
                        // Swipe left - go to searches
                        switchTab('searches');
                    } else if (diffX < 0 && currentTab.includes('search')) {
                        // Swipe right - go to apps
                        switchTab('apps');
                    }
                }
                
                startX = 0;
                startY = 0;
            });
        }

        function addLoadingStates() {
            // Add loading spinner for form submissions
            const form = document.querySelector('form');
            if (form) {
                form.addEventListener('submit', function() {
                    const submitBtn = form.querySelector('select');
                    if (submitBtn) {
                        submitBtn.style.opacity = '0.7';
                        submitBtn.disabled = true;
                    }
                });
            }
        }

        function addPullToRefresh() {
            let startY = 0;
            let pullDistance = 0;
            const pullThreshold = 100;
            
            document.addEventListener('touchstart', function(e) {
                if (window.scrollY === 0) {
                    startY = e.touches[0].clientY;
                }
            });
            
            document.addEventListener('touchmove', function(e) {
                if (startY && window.scrollY === 0) {
                    pullDistance = e.touches[0].clientY - startY;
                    if (pullDistance > 0) {
                        e.preventDefault();
                        document.body.style.transform = `translateY(${Math.min(pullDistance * 0.5, 100)}px)`;
                    }
                }
            });
            
            document.addEventListener('touchend', function(e) {
                if (pullDistance > pullThreshold) {
                    // Trigger refresh
                    window.location.reload();
                } else {
                    document.body.style.transform = '';
                }
                startY = 0;
                pullDistance = 0;
            });
        }

        function addSwipeNavigation() {
            const tabs = document.querySelector('.tabs');
            if (tabs) {
                tabs.addEventListener('touchstart', function(e) {
                    this.style.overflowX = 'hidden';
                });
                
                tabs.addEventListener('touchend', function(e) {
                    setTimeout(() => {
                        this.style.overflowX = 'auto';
                    }, 300);
                });
            }
        }

        function optimizeForMobile() {
            // Reduce chart animations on mobile for better performance
            if (window.innerWidth < 768) {
                Chart.defaults.animation = false;
            }
            
            // Add mobile-specific chart options
            if (window.innerWidth < 768) {
                if (window.appChart) {
                    window.appChart.options.animation = false;
                    window.appChart.update();
                }
                if (window.searchChart) {
                    window.searchChart.options.animation = false;
                    window.searchChart.update();
                }
            }
            
            // Optimize table scrolling on mobile
            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
                table.style.fontSize = window.innerWidth < 480 ? '0.8rem' : '0.9rem';
            });
        }

        // Add vibration feedback for mobile (if supported)
        function vibrate(pattern = [10]) {
            if ('vibrate' in navigator) {
                navigator.vibrate(pattern);
            }
        }

        // Enhanced tab switching with haptic feedback
        function switchTabWithFeedback(tabName) {
            vibrate([10]);
            switchTab(tabName);
        }

        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                const currentTab = document.querySelector('.tab.active').textContent.trim().toLowerCase();
                if (e.key === 'ArrowLeft' && currentTab.includes('search')) {
                    switchTab('apps');
                } else if (e.key === 'ArrowRight' && currentTab.includes('app')) {
                    switchTab('searches');
                }
            }
        });

        // Auto-refresh data every 5 minutes on mobile
        if (window.innerWidth < 768) {
            setInterval(function() {
                // Only refresh if user is on the page
                if (!document.hidden) {
                    const currentUrl = window.location.href;
                    fetch(currentUrl)
                        .then(response => response.text())
                        .then(data => {
                            // Update only the data parts, not the entire page
                            console.log('Data refreshed for mobile');
                        })
                        .catch(error => {
                            console.log('Auto-refresh failed:', error);
                        });
                }
            }, 300000); // 5 minutes
        }

        // Add mobile menu for better navigation
        function addMobileMenu() {
            if (window.innerWidth < 768) {
                const header = document.querySelector('.header');
                const menuButton = document.createElement('button');
                menuButton.innerHTML = '<i class="fas fa-bars"></i>';
                menuButton.style.cssText = `
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 10px;
                    border-radius: 8px;
                    font-size: 1.2rem;
                `;
                header.appendChild(menuButton);
                
                menuButton.addEventListener('click', function() {
                    // Toggle mobile menu (you can expand this)
                    alert('Mobile menu - Add your navigation items here');
                });
            }
        }

        // Initialize mobile menu
        addMobileMenu();
    </script>
</body>
</html>

