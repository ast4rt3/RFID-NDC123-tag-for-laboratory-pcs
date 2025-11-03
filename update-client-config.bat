@echo off
REM Batch script to update the client config with the current server IP

set "SERVER_IP=192.168.1.11"
set "SERVER_PORT=8080"

echo ========================================
echo Updating RFID Client Configuration
echo ========================================
echo Server IP: %SERVER_IP%
echo Server Port: %SERVER_PORT%
echo.

REM Update config in project root
echo Updating config in project root...
(
echo {
echo   "serverIP": "%SERVER_IP%",
echo   "serverPort": %SERVER_PORT%
echo }
) > "%~dp0config.json"
echo ✓ Updated: %~dp0config.json

REM Update config in installed application directory
set "INSTALL_DIR=C:\Users\%USERNAME%\AppData\Local\Programs\RFID NDC123 Client"
if exist "%INSTALL_DIR%" (
    echo.
    echo Updating config in installed application...
    (
    echo {
    echo   "serverIP": "%SERVER_IP%",
    echo   "serverPort": %SERVER_PORT%
    echo }
    ) > "%INSTALL_DIR%\config.json"
    echo ✓ Updated: %INSTALL_DIR%\config.json
) else (
    echo.
    echo ⚠ Installed application directory not found: %INSTALL_DIR%
)

REM Also try alternative installation path
set "ALT_INSTALL_DIR=C:\Users\%USERNAME%\AppData\Local\Programs\rfid-ndc123-tag-for-laboratory-pc"
if exist "%ALT_INSTALL_DIR%" (
    echo.
    echo Updating config in alternative installation path...
    (
    echo {
    echo   "serverIP": "%SERVER_IP%",
    echo   "serverPort": %SERVER_PORT%
    echo }
    ) > "%ALT_INSTALL_DIR%\config.json"
    echo ✓ Updated: %ALT_INSTALL_DIR%\config.json
)

echo.
echo ========================================
echo ✓ Configuration updated successfully!
echo ========================================
echo.
echo Please restart the RFID Client application for changes to take effect.
echo.
pause