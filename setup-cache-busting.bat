@echo off
echo Setting up cache busting for Windows...

echo Installing cross-env package...
call npm install cross-env --save-dev

echo Clearing Vite cache...
if exist .vite (
  rmdir /s /q .vite
)

echo Running development server...
call npm run dev

echo.
echo Cache busting setup complete!
echo.
echo To build the project with cache busting:
echo npm run build
echo.
echo To test the production build locally:
echo npm run preview
echo.
echo To deploy with cache busting:
echo npm run deploy 