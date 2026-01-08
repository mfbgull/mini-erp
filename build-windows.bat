@echo off
echo ============================================
echo   Mini ERP - Windows Build Script
echo ============================================
echo.

echo [1/3] Installing dependencies...
call npm run install-deps
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/3] Building client (React frontend)...
call npm run build-client
if errorlevel 1 (
    echo ERROR: Failed to build client
    pause
    exit /b 1
)

echo.
echo [3/3] Building Windows installer...
call npm run dist-win
if errorlevel 1 (
    echo ERROR: Failed to build installer
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo Installer location: dist\Mini ERP Setup 1.0.0.exe
echo.
echo You can now distribute this .exe file to users.
echo Double-click to install Mini ERP on any Windows machine.
echo.
pause
