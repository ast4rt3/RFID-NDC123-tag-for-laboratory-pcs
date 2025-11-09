@echo off
echo ========================================
echo Building RFID NDC123 Client Installer
echo ========================================
echo.

echo [1/4] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Downloading LibreHardwareMonitor...
node download-librehardwaremonitor.js
if %errorlevel% neq 0 (
    echo ERROR: Failed to download LibreHardwareMonitor
    echo You can continue without it, but CPU temperature monitoring won't work.
    echo.
    choice /C YN /M "Continue anyway"
    if errorlevel 2 exit /b 1
)

echo.
echo [3/4] Building the installer...
npm run build-installer
if %errorlevel% neq 0 (
    echo ERROR: Failed to build installer
    pause
    exit /b 1
)

echo.
echo [4/4] Build complete!
echo ========================================
echo.
echo Installer created in: dist\
echo.
echo The installer includes:
echo   - RFID Client Application
echo   - LibreHardwareMonitor (for CPU temperature)
echo   - All required dependencies
echo.
echo ========================================
pause