# PowerShell script to set up config file for RFID NDC123 Client

Write-Host "Setting up config file for RFID NDC123 Client..." -ForegroundColor Green

# Get the installation directory
$installDir = "C:\Users\$env:USERNAME\AppData\Local\Programs\RFID NDC123 Client"

# Create the config content
$configContent = @"
{
  "serverIP": "192.168.1.2",
  "serverPort": 8080
}
"@

# Create config.json in the installation directory
Write-Host "Creating config.json in $installDir" -ForegroundColor Yellow
$configContent | Out-File -FilePath "$installDir\config.json" -Encoding UTF8

Write-Host "Config file created successfully!" -ForegroundColor Green
Write-Host "Please edit the serverIP in $installDir\config.json to match your server's IP address." -ForegroundColor Yellow
Read-Host "Press Enter to continue"