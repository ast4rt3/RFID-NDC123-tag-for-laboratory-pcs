@echo off
echo Fixing RFID NDC123 Client configuration...

REM Create config.json in the main installation directory
set "INSTALL_DIR=C:\Users\%USERNAME%\AppData\Local\Programs\RFID NDC123 Client"

echo Creating config.json in %INSTALL_DIR%
(
echo {
echo   "serverIP": "192.168.1.2",
echo   "serverPort": 8080
echo }
) > "%INSTALL_DIR%\config.json"

echo.
echo Config file created successfully!
echo Location: %INSTALL_DIR%\config.json
echo.
echo Please edit the serverIP if needed to match your server's IP address.
echo.
pause