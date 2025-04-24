@echo off
echo Setting up cache busting for Windows...

echo Installing cross-env package...
call npm install cross-env --save-dev

echo Creating timestamp file...
echo const timestamp = "%DATE:~-4%%DATE:~4,2%%DATE:~7,2%%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"; > src\utils\timestamp.js
echo export default timestamp; >> src\utils\timestamp.js

echo Updating version.js to use timestamp...
echo // Auto-generated timestamp > src\utils\build-info.js
echo export const BUILD_TIMESTAMP = "%DATE:~-4%%DATE:~4,2%%DATE:~7,2%%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"; >> src\utils\build-info.js
echo export const APP_VERSION = "1.0.0"; >> src\utils\build-info.js

echo Clearing Vite cache...
if exist .vite (
  rmdir /s /q .vite
)

echo.
echo Cache busting setup complete!
echo.
echo To run the development server:
echo npm run dev
echo.
echo To build the project with cache busting:
echo npm run build
echo.
echo To deploy with cache busting:
echo npm run deploy:cache 