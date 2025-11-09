@echo off
setlocal enabledelayedexpansion
echo ========================================
echo   RFID NDC123 Server Installer
echo ========================================
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul
echo.

:: Check if running as administrator (non-blocking)
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Not running as Administrator
    echo Some operations may require administrator privileges.
    echo.
    echo Continue anyway? (Y/N)
    set /p continue="> "
    if /i not "!continue!"=="Y" (
        echo Installation cancelled.
        pause
        exit /b 1
    )
    echo.
)

:: Check if Node.js is installed
echo [1/6] Checking for Node.js...
where node >nul 2>&1
set NODE_CHECK=%errorLevel%
if %NODE_CHECK% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo Minimum version required: Node.js 16.x or higher
    echo.
    echo After installing Node.js, run this installer again.
    echo.
    pause
    exit /b 1
)

echo Checking Node.js version...
node --version
if %errorLevel% neq 0 (
    echo [ERROR] Node.js check failed!
    pause
    exit /b 1
)
echo [OK] Node.js is installed
echo.

:: Check if npm is installed
echo [2/6] Checking for npm...
where npm >nul 2>&1
set NPM_CHECK=%errorLevel%
if %NPM_CHECK% neq 0 (
    echo.
    echo [ERROR] npm is not installed!
    echo npm should come with Node.js installation.
    echo.
    pause
    exit /b 1
)

echo Checking npm version...
npm --version
if %errorLevel% neq 0 (
    echo [ERROR] npm check failed!
    pause
    exit /b 1
)
echo [OK] npm is installed
echo.

:: Install dependencies
echo [3/6] Installing server dependencies...
echo This may take a few minutes...
echo Please wait...
echo.
call npm install --production
set INSTALL_ERROR=%errorLevel%
if %INSTALL_ERROR% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo Error code: %INSTALL_ERROR%
    echo.
    echo Troubleshooting:
    echo   1. Check your internet connection
    echo   2. Try running: npm cache clean --force
    echo   3. Make sure you have enough disk space
    echo.
    pause
    exit /b 1
)
echo.
echo [OK] Dependencies installed successfully
echo.

:: Create server-config.env if it doesn't exist
echo [4/6] Setting up configuration...
if not exist "server-config.env" (
    echo Creating server-config.env file...
    (
        echo # Database Configuration
        echo # Set to 'memory' for in-memory storage, 'sqlite' for local database, or 'supabase' for cloud database
        echo DB_TYPE=memory
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo WS_PORT=8080
        echo.
        echo # Supabase Configuration ^(only needed if DB_TYPE=supabase^)
        echo SUPABASE_URL=https://your-project-id.supabase.co
        echo SUPABASE_ANON_KEY=your-anon-key-here
    ) > server-config.env
    echo [OK] Configuration file created: server-config.env
    echo.
    echo [IMPORTANT] Please edit server-config.env and configure your settings:
    echo   - Set DB_TYPE to 'memory', 'sqlite', or 'supabase'
    echo   - If using Supabase, add your SUPABASE_URL and SUPABASE_ANON_KEY
    echo   - Adjust PORT and WS_PORT if needed
    echo.
) else (
    echo [OK] Configuration file already exists: server-config.env
)
echo.

:: Create startup script
echo [5/6] Creating startup script...
(
    echo @echo off
    echo title RFID NDC123 Server
    echo echo Starting RFID NDC123 Server...
    echo echo.
    echo cd /d "%~dp0"
    echo call npm start
    echo pause
) > start-server.bat
echo [OK] Startup script created: start-server.bat
echo.

:: Create service installation script (optional)
echo [6/6] Creating Windows Service installer (optional)...
(
    echo @echo off
    echo echo Installing RFID NDC123 Server as Windows Service...
    echo echo.
    echo echo This requires node-windows package. Installing...
    echo call npm install -g node-windows
    echo echo.
    echo echo Creating service...
    echo node install-service.js
    echo pause
) > install-service.bat
echo [OK] Service installer created: install-service.bat
echo.

:: Summary
echo.
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit server-config.env to configure your database
echo   2. Run start-server.bat to start the server
echo   3. (Optional) Run install-service.bat to install as Windows Service
echo.
echo Server will be available at:
echo   - HTTP API: http://localhost:3000
echo   - WebSocket: ws://localhost:8080
echo   - Status Page: http://localhost:3000/status-page
echo.
echo ========================================
echo.
echo Installation completed successfully!
echo Press any key to exit...
pause >nul
exit /b 0

