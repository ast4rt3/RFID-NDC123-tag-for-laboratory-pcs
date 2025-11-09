@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   RFID NDC123 Server Installer (DEBUG)
echo ========================================
echo.
echo This is a debug version that will show more information.
echo.
echo Current directory: %CD%
echo.
pause
echo.

:: Check Node.js
echo Checking Node.js...
where node
if %errorLevel% neq 0 (
    echo ERROR: Node.js not found in PATH
    echo.
    echo Please check:
    echo   1. Node.js is installed
    echo   2. Node.js is in your system PATH
    echo.
    pause
    exit /b 1
)

node --version
npm --version
echo.
pause
echo.

:: Check if package.json exists
echo Checking for package.json...
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Make sure you're running this from the project root directory.
    echo.
    pause
    exit /b 1
)
echo [OK] package.json found
echo.

:: Check if server folder exists
echo Checking for server folder...
if not exist "server" (
    echo ERROR: server folder not found!
    echo Make sure the server folder exists.
    echo.
    pause
    exit /b 1
)
echo [OK] server folder found
echo.

:: Try to install dependencies
echo Attempting to install dependencies...
echo This will show all output...
echo.
call npm install --production
set INSTALL_RESULT=%errorLevel%
echo.
echo Install completed with exit code: %INSTALL_RESULT%
echo.

if %INSTALL_RESULT% neq 0 (
    echo ERROR: npm install failed!
    echo.
    echo Try running these commands manually:
    echo   npm cache clean --force
    echo   npm install --production
    echo.
) else (
    echo [OK] Dependencies installed successfully
)
echo.
pause


