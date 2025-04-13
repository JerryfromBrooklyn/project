# Kill all Node.js processes
Write-Host "Killing all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean Vite cache
Write-Host "Cleaning Vite cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .vite -ErrorAction SilentlyContinue

# Create directories if needed
Write-Host "Setting up directories..." -ForegroundColor Yellow
if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" -Force | Out-Null
}
if (-not (Test-Path "src\utils")) {
    New-Item -ItemType Directory -Path "src\utils" -Force | Out-Null
}

# Generate timestamp
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$version = "1.0.0"

# Create build-info.js
Write-Host "Creating build-info.js..." -ForegroundColor Yellow
$buildInfoContent = @"
// Auto-generated timestamp
export const BUILD_TIMESTAMP = "$timestamp";
export const APP_VERSION = "$version";
"@
Set-Content -Path "src\utils\build-info.js" -Value $buildInfoContent -Encoding UTF8

# Create simple timestamp generator script
Write-Host "Creating timestamp generator script..." -ForegroundColor Yellow
$timestampScript = @"
const fs = require('fs');
const path = require('path');

// Generate timestamp in format YYYYMMDDHHMMSS
const now = new Date();
const timestamp = 
  now.getFullYear().toString() +
  (now.getMonth() + 1).toString().padStart(2, '0') +
  now.getDate().toString().padStart(2, '0') +
  now.getHours().toString().padStart(2, '0') +
  now.getMinutes().toString().padStart(2, '0') +
  now.getSeconds().toString().padStart(2, '0');

// Create build-info.js file
const buildInfoPath = path.join(__dirname, '..', 'src', 'utils', 'build-info.js');
const buildInfoContent = \`// Auto-generated timestamp
export const BUILD_TIMESTAMP = "\${timestamp}";
export const APP_VERSION = "1.0.0";
\`;

// Write file
fs.writeFileSync(buildInfoPath, buildInfoContent);

console.log(\`Build info generated with timestamp \${timestamp}\`);
"@
Set-Content -Path "scripts\generate-timestamp.js" -Value $timestampScript -Encoding UTF8

# Update package.json to use simpler build approach
Write-Host "Updating package.json..." -ForegroundColor Yellow
$packageJson = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
$packageJson.scripts.build = "node scripts/generate-timestamp.js && vite build"
$packageJson.scripts.dev = "node scripts/generate-timestamp.js && vite"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "package.json" -Encoding UTF8

# Create a simple batch file for building
Write-Host "Creating build.bat..." -ForegroundColor Yellow
$buildBat = @"
@echo off
echo Generating build timestamp...
node scripts\generate-timestamp.js

echo Building project...
call vite build

echo.
echo Build completed!
echo.
"@
Set-Content -Path "build.bat" -Value $buildBat -Encoding UTF8

Write-Host "All fixed! Run build.bat to build with cache busting" -ForegroundColor Green
Write-Host "Or run: npm run dev" -ForegroundColor Green 