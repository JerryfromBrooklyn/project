@echo off
echo Generating build timestamp...
node scripts\generate-timestamp.js

echo Building with cache busting...
call npm run build

echo Deploying to S3 with cache headers...
echo HTML files (no cache)...
call npm run s3-sync:html

echo Asset files (long cache)...
call npm run s3-sync:assets

echo Invalidating CloudFront...
call npm run invalidate-cf

echo.
echo Deployment completed!
echo. 