#!/bin/bash

# Exit on error
set -e

echo "================================================="
echo "🚀 STARTING BUILD AND DEPLOYMENT PROCESS"
echo "================================================="

# 1. Build the application
echo "📦 Building application..."
npm run build || { echo "❌ Build failed!"; exit 1; }

# 2. Upload to S3
echo "☁️ Uploading to S3 bucket..."
aws s3 sync dist/ s3://shmong --delete || { echo "❌ S3 upload failed!"; exit 1; }

# 3. Check AWS credentials and CloudFront access before invalidation
echo "🔍 Checking AWS credentials..."
aws sts get-caller-identity || { 
  echo "❌ AWS credentials check failed! Make sure you have valid AWS credentials configured."
  exit 1
}

# Check CloudFront distribution
echo "🔍 Checking CloudFront distribution details..."
aws cloudfront get-distribution --id E3OEKXFISG92UV || {
  echo "❌ CloudFront distribution check failed! The distribution ID 'E3OEKXFISG92UV' may be incorrect."
  echo "Please verify the correct distribution ID using: aws cloudfront list-distributions"
  exit 1
}

# 3. Invalidate CloudFront cache
echo "🔄 Invalidating CloudFront cache..."
echo "Distribution ID: E3OEKXFISG92UV"
echo "Paths pattern: /*"
aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths "/*" || {
  echo "❌ CloudFront invalidation failed!"
  echo "This may be due to:"
  echo "  - Insufficient IAM permissions (needs: cloudfront:CreateInvalidation)"
  echo "  - Incorrect distribution ID"
  echo "  - Network connectivity issues"
  echo "Try running this command manually to see detailed error:"
  echo "  aws cloudfront create-invalidation --distribution-id E3OEKXFISG92UV --paths '/*'"
  exit 1
}

# 4. Verify deployment
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "================================================="
echo "✅ DEPLOYMENT COMPLETE: $TIMESTAMP"
echo "🔗 Verify at: https://d3hl8q20rgtlyy.cloudfront.net"
echo "================================================="

# Wait for CloudFront invalidation to complete
echo "⏳ CloudFront invalidation in progress..."
echo "  Cache invalidation typically takes 5-15 minutes to propagate completely."
echo "  However, the new version should be accessible shortly."
echo "=================================================" 