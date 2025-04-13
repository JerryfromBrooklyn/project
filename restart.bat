@echo off
echo Killing all Node.js processes...
taskkill /F /IM node.exe

echo Clearing Vite cache...
rmdir /s /q .vite

echo Starting development server...
npm run dev

echo.
echo If the server doesn't start, run:
echo npm run dev
echo. 