@echo off
echo Generating build timestamp...
node scripts\generate-timestamp.js

echo Building project...
call vite build

echo.
echo Build completed!
echo.
