@echo off
echo ========================================
echo       VITE CACHE CLEANER
echo ========================================
echo.

REM Kill any running Node processes
echo Stopping any running Node processes...
taskkill /f /im node.exe >nul 2>&1

REM Remove Vite cache directories
echo Cleaning cache directories...
IF EXIST ".vite_cache" (
  echo Removing .vite_cache
  rmdir /s /q ".vite_cache"
)

IF EXIST "node_modules\.vite" (
  echo Removing node_modules\.vite
  rmdir /s /q "node_modules\.vite"
)

IF EXIST "node_modules\.cache" (
  echo Removing node_modules\.cache
  rmdir /s /q "node_modules\.cache"
)

REM Clear the browser cache
echo Setting environment variables for clean restart...
set VITE_FORCE_OPTIMIZEDEPS=true
set VITE_FORCE_RELOAD=true

REM Start the development server again
echo.
echo ========================================
echo Starting Vite with clean cache...
echo ========================================
echo.
npm run dev 