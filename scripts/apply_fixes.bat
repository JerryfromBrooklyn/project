@echo off
setlocal enabledelayedexpansion

echo Starting database fix process...

REM Change to the script directory
cd /d "%~dp0"

echo Applying latest migration...
call npx supabase migration up

echo Running fix_all_face_registrations...
call npx supabase db exec "SELECT admin_fix_all_face_registrations()"

echo Running fix_photo_face_matches...
call npx supabase db exec "SELECT fix_photo_face_matches()"

echo.
echo Database fixes applied successfully.
echo The following features should now work correctly:
echo - User sign in and sign up
echo - Face registration
echo - Historical/future face matching
echo - Photo display in the photos tab
echo.
echo Complete!

pause 