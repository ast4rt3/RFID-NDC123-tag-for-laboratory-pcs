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

$data = [];
$chartData = [];
$dates = [];

if ($pcName) {
    // Fetch available dates for dropdown
    $dateQuery = $conn->prepare("SELECT DISTINCT DATE(start_time) as log_date FROM app_usage_logs WHERE pc_name = ? ORDER BY log_date DESC");
    $dateQuery->bind_param("s", $pcName);
    $dateQuery->execute();
    $dateResult = $dateQuery->get_result();
    while ($row = $dateResult->fetch_assoc()) {
        $dates[] = $row['log_date'];
    }

    // Table data for selected date
    $stmt = $conn->prepare("SELECT start_time, end_time, duration_seconds, app_name, memory_usage_bytes, cpu_percent, gpu_percent FROM app_usage_logs WHERE pc_name = ? AND DATE(start_time) = ?");
    $stmt->bind_param("ss", $pcName, $selectedDate);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    // Chart data: group by app_name
    $chartStmt = $conn->prepare("SELECT app_name, SUM(duration_seconds) AS total_duration FROM app_usage_logs WHERE pc_name = ? AND DATE(start_time) = ? GROUP BY app_name ORDER BY total_duration DESC");
    $chartStmt->bind_param("ss", $pcName, $selectedDate);
    $chartStmt->execute();
    $chartResult = $chartStmt->get_result();
    while ($row = $chartResult->fetch_assoc()) {
        $chartData[] = $row;
    }
}
?>
<!DOCTYPE html>
<html>
<head>
    <title>RFID scan - <?= htmlspecialchars($pcName) ?></title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
        th { background-color: #f5f5f5; }
        select { padding: 5px; }
    </style>
</head>
<body>
    <h2>Report for PC: <strong><?= htmlspecialchars($pcName) ?></strong></h2>

    <form method="get">
        <input type="hidden" name="pc_name" value="<?= htmlspecialchars($pcName) ?>">
        <label for="date">Select Date:</label>
        <select name="date" id="date" onchange="this.form.submit()">
            <?php foreach ($dates as $date): ?>
                <option value="<?= $date ?>" <?= $date == $selectedDate ? 'selected' : '' ?>><?= $date ?></option>
            <?php endforeach; ?>
        </select>
    </form>

    <h3>App Usage Chart (<?= $selectedDate ?>)</h3>
    <canvas id="usageChart" width="800" height="400"></canvas>

    <h3>Detailed Log Entries</h3>
    <table>
        <thead>
            <tr>
                <th>App Name</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration (min)</th>
                <th>Memory (MB)</th>
                <th>CPU %</th>
                <th>GPU %</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($data as $entry): ?>
                <tr>
                    <td><?= $entry['app_name'] ?></td>
                    <td><?= $entry['start_time'] ?></td>
                    <td><?= $entry['end_time'] ?></td>
                    <td><?= round($entry['duration_seconds'] / 60, 2) ?></td>
                    <td><?= number_format($entry['memory_usage_bytes'] / 1048576, 2) ?></td>
                    <td><?= $entry['cpu_percent'] ?></td>
                    <td><?= $entry['gpu_percent'] ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <script>
        const chartData = <?= json_encode($chartData) ?>;
        const labels = chartData.map(item => item.app_name);
        const durations = chartData.map(item => (item.total_duration / 60).toFixed(2)); // convert to minutes

        const ctx = document.getElementById('usageChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Duration (minutes)',
                    data: durations,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Total Usage per App'
                    },
                    legend: { display: false }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Minutes'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Applications'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
