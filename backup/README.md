# Backup Files

These are backup copies of the original files before the API call optimization changes were implemented on March 30, 2025.

## How to Restore

If you need to restore the original files, use these PowerShell commands:

```powershell
# Restore FaceStorageService.js
Copy-Item -Path "backup\FaceStorageService.js.backup" -Destination "src\services\FaceStorageService.js" -Force

# Restore PhotoManager.js
Copy-Item -Path "backup\PhotoManager.js.backup" -Destination "src\components\PhotoManager.js" -Force

# Delete the supabaseClient.js file if you want to completely revert
Remove-Item -Path "src\supabaseClient.js" -Force
```

## Changes Made

The optimizations included:
1. Creating a supabaseClient.js file with caching mechanisms
2. Updating FaceStorageService.js to use caching
3. Optimizing the database schema checking in PhotoManager.js
4. Reducing redundant API calls for face ID lookup

## Environment Variables Required

The updated implementation requires the following environment variables:

```
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_SUPABASE_SERVICE_KEY=your-service-role-key
```

The service role key is required for administrative operations that bypass Row Level Security (RLS), such as:
- Accessing information_schema tables
- Listing database functions
- Performing storage operations for other users

Without the service role key, these operations will fail with 404/403 errors.

## Notes on Service Role Key Security

The service role key should be handled with care:
- Never expose it in client-side code in production
- For production, inject the key via environment variables on the server
- Only use it for admin/service operations that require elevated privileges

If you encounter any issues with the optimized version, restore these backup files and restart the application. 