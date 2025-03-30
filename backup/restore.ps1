# restore.ps1 - Script to restore original files before API call optimizations

Write-Host "Restoring original files from backup..." -ForegroundColor Yellow

# Restore FaceStorageService.js
Copy-Item -Path "backup\FaceStorageService.js.backup" -Destination "src\services\FaceStorageService.js" -Force
Write-Host "✓ Restored FaceStorageService.js" -ForegroundColor Green

# Restore PhotoManager.js
Copy-Item -Path "backup\PhotoManager.js.backup" -Destination "src\components\PhotoManager.js" -Force
Write-Host "✓ Restored PhotoManager.js" -ForegroundColor Green

# Check if supabaseClient.js exists and delete it
if (Test-Path -Path "src\supabaseClient.js") {
    Remove-Item -Path "src\supabaseClient.js" -Force
    Write-Host "✓ Removed supabaseClient.js" -ForegroundColor Green
} else {
    Write-Host "! supabaseClient.js not found" -ForegroundColor Yellow
}

Write-Host "Restore complete. Please restart your development server." -ForegroundColor Cyan 