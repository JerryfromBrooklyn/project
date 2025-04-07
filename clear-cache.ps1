Write-Host "========================================"
Write-Host "       VITE CACHE CLEANER" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""

# Kill any running Node processes
Write-Host "Stopping any running Node processes..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "Node processes stopped" -ForegroundColor Green
} catch {
    Write-Host "No Node processes found to stop" -ForegroundColor Cyan
}

# Remove Vite cache directories
Write-Host "Cleaning cache directories..." -ForegroundColor Yellow
$cacheDirs = @(
    ".vite_cache",
    "node_modules\.vite",
    "node_modules\.cache"
)

foreach ($dir in $cacheDirs) {
    if (Test-Path $dir) {
        Write-Host "Removing $dir" -ForegroundColor Yellow
        Remove-Item -Path $dir -Recurse -Force
    }
}

# Set environment variables for clean restart
Write-Host "Setting environment variables for clean restart..." -ForegroundColor Yellow
$env:VITE_FORCE_OPTIMIZEDEPS = "true"
$env:VITE_FORCE_RELOAD = "true"

# Start the development server again
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Starting Vite with clean cache..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

npm run dev 