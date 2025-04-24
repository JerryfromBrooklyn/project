# Update Lambda functions with new code

# Update login function
Write-Host "Updating shmong-login function..."
aws lambda update-function-code --function-name shmong-login --zip-file fileb://deployment-packages/login.zip --no-cli-pager

# Update face register function
Write-Host "Updating shmong-face-register function..."
aws lambda update-function-code --function-name shmong-face-register --zip-file fileb://deployment-packages/face-register.zip --no-cli-pager

# Update user face data function
Write-Host "Updating shmong-user-face-data function..."
aws lambda update-function-code --function-name shmong-user-face-data --zip-file fileb://deployment-packages/user-face-data.zip --no-cli-pager

# Update historical matches function
Write-Host "Updating shmong-historical-matches function..."
aws lambda update-function-code --function-name shmong-historical-matches --zip-file fileb://deployment-packages/historical-matches.zip --no-cli-pager

# Update recent matches function
Write-Host "Updating shmong-recent-matches function..."
aws lambda update-function-code --function-name shmong-recent-matches --zip-file fileb://deployment-packages/recent-matches.zip --no-cli-pager

# Create face stats function if it doesn't exist
Write-Host "Creating or updating shmong-face-stats function..."
$result = aws lambda list-functions --query "Functions[?FunctionName=='shmong-face-stats']" --output text --no-cli-pager
if ($result) {
    # Function exists, update it
    aws lambda update-function-code --function-name shmong-face-stats --zip-file fileb://deployment-packages/face-stats.zip --no-cli-pager
} else {
    # Create new function
    aws lambda create-function --function-name shmong-face-stats --runtime nodejs18.x --role arn:aws:iam::774305584181:role/ShmongLambdaExecRole --handler index.handler --zip-file fileb://deployment-packages/face-stats.zip --no-cli-pager
}

Write-Host "All Lambda functions updated successfully!" 