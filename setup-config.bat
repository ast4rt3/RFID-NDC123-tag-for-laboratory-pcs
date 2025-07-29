@echo off
echo Setting up config file for RFID NDC123 Client...

REM Get the installation directory
set "INSTALL_DIR=C:\Users\%USERNAME%\AppData\Local\Programs\RFID NDC123 Client"

REM Create config.json in the installation directory
echo Creating config.json in %INSTALL_DIR%
echo {> "%INSTALL_DIR%\config.json"
echo   "serverIP": "192.168.1.2",>> "%INSTALL_DIR%\config.json"
echo   "serverPort": 8080>> "%INSTALL_DIR%\config.json"
echo }>> "%INSTALL_DIR%\config.json"

echo Config file created successfully!
echo Please edit the serverIP in %INSTALL_DIR%\config.json to match your server's IP address.
pause