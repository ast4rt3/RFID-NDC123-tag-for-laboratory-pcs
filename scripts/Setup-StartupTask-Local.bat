@echo off
REM ========================================
REM Local Scheduled Task Setup Script
REM Run this script on EACH PC individually
REM ========================================

echo ========================================
echo   RFID Client - Local Task Setup
echo ========================================
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script requires Administrator privileges.
    echo         Right-click and select "Run as Administrator"
    echo.
    pause
    exit /b 1
)

REM Find the executable
set "EXE_PATH="
if exist "C:\Program Files\RFID NDC123 Client\RFID NDC123 Client.exe" (
    set "EXE_PATH=C:\Program Files\RFID NDC123 Client\RFID NDC123 Client.exe"
) else if exist "C:\Program Files (x86)\RFID NDC123 Client\RFID NDC123 Client.exe" (
    set "EXE_PATH=C:\Program Files (x86)\RFID NDC123 Client\RFID NDC123 Client.exe"
) else if exist "%LOCALAPPDATA%\Programs\RFID NDC123 Client\RFID NDC123 Client.exe" (
    set "EXE_PATH=%LOCALAPPDATA%\Programs\RFID NDC123 Client\RFID NDC123 Client.exe"
)

if "%EXE_PATH%"=="" (
    echo [WARNING] Could not find RFID Client executable automatically.
    echo.
    set /p "EXE_PATH=Enter the full path to 'RFID NDC123 Client.exe': "
    
    if not exist "%EXE_PATH%" (
        echo [ERROR] File not found: %EXE_PATH%
        echo.
        pause
        exit /b 1
    )
) else (
    echo [OK] Found executable: %EXE_PATH%
)

echo.
echo Configuration:
echo   Task Name    : RFID Client Startup
echo   Executable   : %EXE_PATH%
echo   Trigger      : On user logon
echo   Run Level    : Highest (SYSTEM - bypasses UAC)
echo.

set /p "CONFIRM=Create scheduled task? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo Creating scheduled task...

REM Delete existing task if it exists
schtasks /Delete /TN "RFID Client Startup" /F >nul 2>&1

REM Create the scheduled task
schtasks /Create /TN "RFID Client Startup" /SC ONLOGON /RL HIGHEST /F /TR "%EXE_PATH%"

if %errorLevel% equ 0 (
    echo.
    echo [OK] Scheduled task created successfully!
    echo.
    echo Task Details:
    echo   Name        : RFID Client Startup
    echo   Status      : Created and enabled
    echo   Next Run    : On next user logon
    echo.
    echo [OK] Setup complete! The client will start automatically on logon.
    echo.
    echo To verify, open Task Scheduler and look for: RFID Client Startup
) else (
    echo.
    echo [ERROR] Failed to create scheduled task.
    echo.
    pause
    exit /b 1
)

echo.
pause


