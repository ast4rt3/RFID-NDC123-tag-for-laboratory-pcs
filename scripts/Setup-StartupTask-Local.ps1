# ========================================
# Local Scheduled Task Setup Script
# Run this script on EACH PC individually
# ========================================

Param(
    [string]$TaskName = "RFID Client Startup",
    [string]$ExePath = "",
    [switch]$RunNow
)

Write-Host "========================================"
Write-Host "  RFID Client - Local Task Setup"
Write-Host "========================================"
Write-Host ""

# Check if running as Administrator
$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script requires Administrator privileges." -ForegroundColor Yellow
    Write-Host "   Right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Find the executable if not provided
if ([string]::IsNullOrWhiteSpace($ExePath)) {
    $defaultPaths = @(
        "C:\Program Files\RFID NDC123 Client\RFID NDC123 Client.exe",
        "C:\Program Files (x86)\RFID NDC123 Client\RFID NDC123 Client.exe",
        "$env:LOCALAPPDATA\Programs\RFID NDC123 Client\RFID NDC123 Client.exe"
    )
    
    foreach ($path in $defaultPaths) {
        if (Test-Path $path) {
            $ExePath = $path
            Write-Host "✅ Found executable: $ExePath" -ForegroundColor Green
            break
        }
    }
    
    # If still not found, prompt user
    if ([string]::IsNullOrWhiteSpace($ExePath)) {
        Write-Host "⚠️  Could not find RFID Client executable automatically." -ForegroundColor Yellow
        Write-Host ""
        $ExePath = Read-Host "Enter the full path to 'RFID NDC123 Client.exe'"
        
        if (-not (Test-Path $ExePath)) {
            Write-Host "❌ File not found: $ExePath" -ForegroundColor Red
            Write-Host ""
            Write-Host "Press any key to exit..."
            $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
            exit 1
        }
    }
} else {
    if (-not (Test-Path $ExePath)) {
        Write-Host "❌ File not found: $ExePath" -ForegroundColor Red
        Write-Host ""
        Write-Host "Press any key to exit..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        exit 1
    }
}

Write-Host ""
Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Task Name    : $TaskName"
Write-Host "  Executable   : $ExePath"
Write-Host "  Trigger      : On user logon"
Write-Host "  Run Level    : Highest (SYSTEM - bypasses UAC)"
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "Create scheduled task? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Creating scheduled task..." -ForegroundColor Cyan

# Delete existing task if it exists (ignore errors)
$null = schtasks /Delete /TN $TaskName /F 2>$null

# Create the scheduled task
# /SC ONLOGON = Run on user logon
# /RL HIGHEST = Run with highest privileges (SYSTEM user)
# /F = Force (overwrite if exists)
# /TR = Task to run
$taskCommand = "schtasks /Create /TN `"$TaskName`" /SC ONLOGON /RL HIGHEST /F /TR `"$ExePath`""

try {
    $result = Invoke-Expression $taskCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Scheduled task created successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Optionally run the task now
        if ($RunNow) {
            Write-Host "Running task now..." -ForegroundColor Cyan
            $null = schtasks /Run /TN $TaskName
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Task started successfully!" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Task created but could not start immediately." -ForegroundColor Yellow
            }
        }
        
        Write-Host ""
        Write-Host "Task Details:" -ForegroundColor Cyan
        Write-Host "  Name        : $TaskName"
        Write-Host "  Status      : Created and enabled"
        Write-Host "  Next Run    : On next user logon"
        Write-Host ""
        Write-Host "✅ Setup complete! The client will start automatically on logon." -ForegroundColor Green
        Write-Host ""
        Write-Host "To verify, open Task Scheduler and look for: $TaskName" -ForegroundColor Gray
    } else {
        Write-Host "❌ Failed to create scheduled task." -ForegroundColor Red
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "❌ Error creating scheduled task: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")


