@echo off
echo Generating build timestamp...
node scripts\generate-timestamp.js

echo Building with cache busting...
call npm run build

echo.
echo Build completed! To preview:
echo npm run preview
echo. 