<?php
// Database configuration for different environments
$environment = $_ENV['NODE_ENV'] ?? 'local';

switch($environment) {
    case 'aws':
        $host = $_ENV['DB_HOST'] ?? 'your-rds-endpoint.amazonaws.com';
        $user = $_ENV['DB_USER'] ?? 'admin';
        $pass = $_ENV['DB_PASSWORD'] ?? 'your-secure-password';
        $db = $_ENV['DB_NAME'] ?? 'juglone';
        $port = $_ENV['DB_PORT'] ?? 3306;
        break;
        
    case 'gcp':
        $host = $_ENV['DB_HOST'] ?? 'your-cloud-sql-ip';
        $user = $_ENV['DB_USER'] ?? 'root';
        $pass = $_ENV['DB_PASSWORD'] ?? 'your-password';
        $db = $_ENV['DB_NAME'] ?? 'juglone';
        $port = $_ENV['DB_PORT'] ?? 3306;
        break;
        
    case 'planetscale':
        $host = $_ENV['DB_HOST'] ?? 'your-planetscale-host';
        $user = $_ENV['DB_USER'] ?? 'your-username';
        $pass = $_ENV['DB_PASSWORD'] ?? 'your-password';
        $db = $_ENV['DB_NAME'] ?? 'juglone';
        $port = $_ENV['DB_PORT'] ?? 3306;
        break;
        
    default: // local
        $host = "localhost";
        $user = "root";
        $pass = "";
        $db = "juglone";
        $port = 3306;
        break;
}

// Create connection with port
$conn = new mysqli($host, $user, $pass, $db, $port);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Rest of your existing PHP code continues here...
// (The rest of get_summary.php content would go here)
