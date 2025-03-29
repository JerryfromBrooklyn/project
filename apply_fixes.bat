@echo off
echo Running SQL fixes for photo upload issues...

REM Apply the main photo upload fix
echo Applying main photo upload fix...
supabase db query --file supabase/migrations/20250330_fix_photo_upload.sql

REM Apply the photo verification fix
echo Applying photo verification fix...
supabase db query --file supabase/migrations/20250330_photo_verification_fix.sql

REM Apply the photo search function
echo Applying photo search function...
supabase db query --file supabase/migrations/20250330_photo_search_function.sql

echo All database fixes applied successfully!
echo.
echo Please restart your application to see the changes.
pause 