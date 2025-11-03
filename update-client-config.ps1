# PowerShell script to update the client config with the current server IP
# Run this script to update the config for the installed application

param(
    [string]$ServerIP = "192.168.1.11",
    [int]$ServerPort = 8080
)

Write-Host "Updating RFID Client Configuration..." -ForegroundColor Green
Write-Host "Server IP: $ServerIP" -ForegroundColor Yellow
Write-Host "Server Port: $ServerPort" -ForegroundColor Yellow

# Possible installation locations
$possiblePaths = @(
    "C:\Users\$env:USERNAME\AppData\Local\Programs\RFID NDC123 Client\config.json",
    "C:\Users\$env:USERNAME\AppData\Local\Programs\rfid-ndc123-tag-for-laboratory-pc\config.json",
    "$PSScriptRoot\config.json",
    "$PSScriptRoot\client\config.json"
)

# Create the config content
$configContent = @"
{
  "serverIP": "$ServerIP",
  "serverPort": $ServerPort
}
"@

$updated = $false

foreach ($path in $possiblePaths) {
    $dir = Split-Path -Parent $path
    
    # Create directory if it doesn't exist
    if (-not (Test-Path $dir)) {
        try {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "Created directory: $dir" -ForegroundColor Cyan
        } catch {
            continue
        }
    }
    
    # Write config file
    try {
        $configContent | Out-File -FilePath $path -Encoding UTF8 -Force
        Write-Host "✅ Updated config at: $path" -ForegroundColor Green
        $updated = $true
    } catch {
        Write-Host "⚠️ Could not update: $path" -ForegroundColor Yellow
    }
}

if ($updated) {
    Write-Host "`n✅ Configuration updated successfully!" -ForegroundColor Green
    Write-Host "Please restart the RFID Client application for changes to take effect." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Could not update any config files." -ForegroundColor Red
    Write-Host "Please manually create config.json with the following content:" -ForegroundColor Yellow
    Write-Host $configContent -ForegroundColor White
}

Read-Host "`nPress Enter to exit"