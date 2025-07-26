@echo off
echo Building RFID NDC123 Client Installer...
echo.

echo Installing dependencies...
npm install

echo.
echo Building the installer...
npm run build-installer

echo.
echo Build complete! Check the dist folder for the installer.
pause 