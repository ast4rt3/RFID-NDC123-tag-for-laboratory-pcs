@echo off
echo ========================================
echo   Quick Installer Test
echo ========================================
echo.
echo This script will test if the prerequisites are met.
echo.
pause
echo.

echo Testing Node.js...
where node >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Node.js found
    node --version
) else (
    echo [ERROR] Node.js NOT found
    echo Please install Node.js from https://nodejs.org/
)
echo.

echo Testing npm...
where npm >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] npm found
    npm --version
) else (
    echo [ERROR] npm NOT found
)
echo.

echo Testing package.json...
if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json NOT found
    echo Make sure you're in the project root directory
)
echo.

echo Testing server folder...
if exist "server" (
    echo [OK] server folder found
) else (
    echo [ERROR] server folder NOT found
)
echo.

echo ========================================
echo   Test Complete
echo ========================================
echo.
echo If all tests passed, you can run install-server.bat
echo.
pause

