Param(
    [string]$ComputerListPath = ".\lab-pcs.txt",
    [string]$TaskName = "RFID Client Startup",
    [string]$InstalledExePath = "C:\Program Files\RFID NDC123 Client\RFID NDC123 Client.exe",
    [switch]$RunNow
)

Write-Host "========================================"
Write-Host " Create Startup Scheduled Task On PCs   "
Write-Host "========================================"
Write-Host ""

if (-not (Test-Path $ComputerListPath)) {
    Write-Error "Computer list file not found: $ComputerListPath"
    Write-Host "Create a file (one PC name per line), e.g.:"
    Write-Host "  ICSLAB2-PC01"
    Write-Host "  ICSLAB2-PC02"
    exit 1
}

# Ensure we are running elevated
$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentIdentity)
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "This script must be run as Administrator."
    exit 1
}

# Validate target executable path exists locally (advisory)
if (-not (Test-Path $InstalledExePath)) {
    Write-Warning "Installed exe path not found locally: $InstalledExePath"
    Write-Warning "Continuing - this path must exist on each target PC."
}

$computers = Get-Content -Path $ComputerListPath | Where-Object { $_ -and $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }
if ($computers.Count -eq 0) {
    Write-Error "No computer names found in $ComputerListPath"
    exit 1
}

Write-Host "Targets:"
$computers | ForEach-Object { Write-Host " - $_" }
Write-Host ""
Write-Host "Task Name     : $TaskName"
Write-Host "Executable    : $InstalledExePath"
Write-Host "Trigger       : On user logon"
Write-Host "Run Level     : Highest (SYSTEM)"
if ($RunNow) { Write-Host "Post-Create   : Run immediately" }
Write-Host ""

function Invoke-SchTasks {
    param(
        [string]$Computer,
        [string[]]$Arguments
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "schtasks.exe"
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.Arguments = ($Arguments -join " ")

    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    [void]$proc.Start()
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()
    return @{ Code = $proc.ExitCode; Out = $stdout; Err = $stderr }
}

$results = @()
foreach ($computer in $computers) {
    Write-Host "----- $computer -----"

    # Quick online check
    if (-not (Test-Connection -ComputerName $computer -Count 1 -Quiet -ErrorAction SilentlyContinue)) {
        Write-Warning "$computer is not reachable (ping failed). Skipping."
        $results += [pscustomobject]@{ Computer=$computer; Status="Unreachable"; Detail="Ping failed" }
        continue
    }

    # Delete existing task (ignore failures)
    $deleteArgs = @("/Delete", "/S", "`"$computer`"", "/TN", "`"$TaskName`"", "/F")
    [void](Invoke-SchTasks -Computer $computer -Arguments $deleteArgs)

    # Create task
    $quotedExe = '"' + $InstalledExePath + '"'
    $createArgs = @(
        "/Create",
        "/S", "`"$computer`"",
        "/TN", "`"$TaskName`"",
        "/TR", "`"$quotedExe`"",
        "/SC", "ONLOGON",
        "/RL", "HIGHEST",
        "/RU", "`"SYSTEM`"",
        "/F"
    )
    $create = Invoke-SchTasks -Computer $computer -Arguments $createArgs
    if ($create.Code -ne 0) {
        Write-Error "Failed to create task on $computer ($($create.Code))"
        if ($create.Out) { Write-Host $create.Out }
        if ($create.Err) { Write-Host $create.Err }
        $results += [pscustomobject]@{ Computer=$computer; Status="CreateFailed"; Detail=$create.Err }
        continue
    } else {
        Write-Host "Task created."
    }

    if ($RunNow) {
        $runArgs = @("/Run", "/S", "`"$computer`"", "/TN", "`"$TaskName`"")
        $run = Invoke-SchTasks -Computer $computer -Arguments $runArgs
        if ($run.Code -ne 0) {
            Write-Warning "Task created, but failed to start on $computer ($($run.Code))"
            $results += [pscustomobject]@{ Computer=$computer; Status="CreatedNotStarted"; Detail=$run.Err }
        } else {
            Write-Host "Task started."
            $results += [pscustomobject]@{ Computer=$computer; Status="CreatedAndStarted"; Detail="" }
        }
    } else {
        $results += [pscustomobject]@{ Computer=$computer; Status="Created"; Detail="" }
    }
}

Write-Host ""
Write-Host "=========== Summary ===========" 
$results | Format-Table -AutoSize
Write-Host "================================"

Write-Host ""
Write-Host "Notes:"
Write-Host " - Requires admin rights on target PCs."
Write-Host " - Remote scheduling uses schtasks.exe; ensure RPC/SMB not blocked by firewall."
Write-Host " - The executable path must exist on each target PC."
Write-Host ""
Write-Host "Done."



