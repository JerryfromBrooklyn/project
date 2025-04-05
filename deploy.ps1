# PowerShell Deployment Script

$ErrorActionPreference = "Stop" # Ensure script errors are terminating

Write-Host "================================================="
Write-Host "STARTING BUILD AND DEPLOYMENT PROCESS"
Write-Host "================================================="

# 1. Build the application
Write-Host "Building application..."
npm run build

# Check if the build was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed! Exiting deployment process."
    exit 1
}

# 2. Upload to S3
Write-Host "Uploading to S3 bucket..."
aws s3 sync dist/ s3://shmong --delete --no-cli-pager

# Check if S3 upload was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 upload failed! Exiting deployment process."
    exit 1
}

# 3. Check AWS credentials and CloudFront access before invalidation
Write-Host "Checking AWS credentials..."
aws sts get-caller-identity --no-cli-pager

if ($LASTEXITCODE -ne 0) {
    Write-Host "AWS credentials check failed! Make sure you have valid AWS credentials configured."
    exit 1
}

# Check CloudFront distribution
Write-Host "Checking CloudFront distribution details..."
aws cloudfront get-distribution --id E3OEKXFISG92UV --no-cli-pager

if ($LASTEXITCODE -ne 0) {
    Write-Host "CloudFront distribution check failed! The distribution ID 'E3OEKXFISG92UV' may be incorrect."
    Write-Host "Please verify the correct distribution ID using: aws cloudfront list-distributions"
    exit 1
}

# 3. Verify AWS Identity again just before invalidation
Write-Host "Verifying AWS identity before CloudFront invalidation..."
aws sts get-caller-identity --no-cli-pager

if ($LASTEXITCODE -ne 0) {
    Write-Host "AWS credentials check failed immediately before CloudFront invalidation!"
    Write-Host "   Check credential scope/availability in the script execution environment."
    exit 1
}

# 4. Invalidate CloudFront cache
Write-Host "Invalidating CloudFront cache..."
Write-Host "Distribution ID: E3OEKXFISG92UV"
Write-Host "Paths pattern: /*"
aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*" --no-cli-pager

# Check if CloudFront invalidation was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "CloudFront invalidation failed!"
    Write-Host "This may be due to:"
    Write-Host "  - Insufficient IAM permissions (like cloudfront:CreateInvalidation)"
    Write-Host "  - Incorrect distribution ID"
    Write-Host "  - Network connectivity issues"
    Write-Host "Try running this command manually to see detailed error:"
    Write-Host "  aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths \`"/*\`" --no-cli-pager"
    exit 1
}

# 4. Verify deployment
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "================================================="
Write-Host "DEPLOYMENT COMPLETE: $timestamp"
Write-Host "Verify at: https://d3hl8q20rgtlyy.cloudfront.net"
Write-Host "================================================="

# Wait for CloudFront invalidation to complete
Write-Host "CloudFront invalidation in progress..."
Write-Host "  Cache invalidation typically takes 5-15 minutes to propagate completely."
Write-Host "  However, the new version should be accessible shortly."
Write-Host "=================================================" 