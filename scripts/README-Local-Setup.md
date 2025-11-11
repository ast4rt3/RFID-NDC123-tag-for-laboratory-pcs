# Local Scheduled Task Setup

These scripts allow you to configure each PC individually to automatically start the RFID Client on logon, bypassing UAC prompts.

## Quick Start

### Option 1: PowerShell Script (Recommended)
1. Copy `Setup-StartupTask-Local.ps1` to the target PC
2. Right-click the script → **Run as Administrator**
3. Follow the prompts

### Option 2: Batch Script
1. Copy `Setup-StartupTask-Local.bat` to the target PC
2. Right-click the script → **Run as Administrator**
3. Follow the prompts

## What It Does

- **Finds** the RFID Client executable automatically (or prompts for path)
- **Creates** a Windows Scheduled Task named "RFID Client Startup"
- **Configures** the task to:
  - Run on user logon
  - Run with highest privileges (SYSTEM user)
  - Bypass UAC prompts
- **Verifies** the task was created successfully

## Requirements

- Administrator privileges (script will check and prompt if needed)
- RFID Client must be installed on the PC

## Default Installation Paths

The script automatically searches for the executable in:
- `C:\Program Files\RFID NDC123 Client\RFID NDC123 Client.exe`
- `C:\Program Files (x86)\RFID NDC123 Client\RFID NDC123 Client.exe`
- `%LOCALAPPDATA%\Programs\RFID NDC123 Client\RFID NDC123 Client.exe`

If not found, you'll be prompted to enter the path manually.

## Verification

After running the script:
1. Open **Task Scheduler** (search in Start menu)
2. Look for **"RFID Client Startup"** in the task list
3. The task should be enabled and set to run on logon

## Troubleshooting

### "This script requires Administrator privileges"
- Right-click the script → **Run as Administrator**

### "File not found"
- Make sure the RFID Client is installed
- Enter the full path manually when prompted

### Task doesn't run on logon
- Check Task Scheduler → Task Scheduler Library → "RFID Client Startup"
- Verify the task is enabled
- Check the "Triggers" tab to ensure "On logon" is configured
- Check the "Actions" tab to verify the executable path is correct


