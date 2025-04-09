# Grant permissions for API Gateway to invoke Lambda functions

# API Gateway ARN
$apiGatewayArn = "arn:aws:execute-api:us-east-1:774305584181:dwqg3yjx8i"

# Grant permission for login function
Write-Host "Granting permission for login function..."
aws lambda add-permission --function-name shmong-login --statement-id apigateway-prod-login --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "$apiGatewayArn/*/POST/api/login" --no-cli-pager

# Grant permission for face register function
Write-Host "Granting permission for face register function..."
aws lambda add-permission --function-name shmong-face-register --statement-id apigateway-prod-face-register --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "$apiGatewayArn/*/POST/api/face/register" --no-cli-pager

# Grant permission for user face data function
Write-Host "Granting permission for user face data function..."
aws lambda add-permission --function-name shmong-user-face-data --statement-id apigateway-prod-user-face-data --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "$apiGatewayArn/*/GET/api/user/face-data" --no-cli-pager

# Grant permission for historical matches function
Write-Host "Granting permission for historical matches function..."
aws lambda add-permission --function-name shmong-historical-matches --statement-id apigateway-prod-historical-matches --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "$apiGatewayArn/*/GET/api/matches/historical" --no-cli-pager

# Grant permission for recent matches function
Write-Host "Granting permission for recent matches function..."
aws lambda add-permission --function-name shmong-recent-matches --statement-id apigateway-prod-recent-matches --action lambda:InvokeFunction --principal apigateway.amazonaws.com --source-arn "$apiGatewayArn/*/GET/api/matches/recent" --no-cli-pager

# Grant permission for face stats function to be invoked by user face data function
Write-Host "Granting permission for face stats function to be invoked by user face data function..."
aws lambda add-permission --function-name shmong-face-stats --statement-id lambda-userface-face-stats --action lambda:InvokeFunction --principal lambda.amazonaws.com --source-arn "arn:aws:lambda:us-east-1:774305584181:function:shmong-user-face-data" --no-cli-pager

Write-Host "All permissions granted successfully!" 