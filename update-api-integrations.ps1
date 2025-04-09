# Update API Gateway integrations

# API Gateway ID
$apiId = "dwqg3yjx8i"

# Resource IDs
$loginResourceId = "txkvrp"
$faceRegisterResourceId = "dmqgur"
$userFaceDataResourceId = "x4nipk"
$historicalMatchesResourceId = "lnw51v"
$recentMatchesResourceId = "2spm2y"

# Update login endpoint integration
Write-Host "Updating login endpoint integration..."
aws apigateway put-integration --rest-api-id $apiId --resource-id $loginResourceId --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:774305584181:function:shmong-login/invocations --no-cli-pager

# Update face register endpoint integration
Write-Host "Updating face register endpoint integration..."
aws apigateway put-integration --rest-api-id $apiId --resource-id $faceRegisterResourceId --http-method POST --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:774305584181:function:shmong-face-register/invocations --no-cli-pager

# Update face register OPTIONS endpoint integration for CORS
Write-Host "Updating face register OPTIONS endpoint integration for CORS..."
aws apigateway put-integration --rest-api-id $apiId --resource-id $faceRegisterResourceId --http-method OPTIONS --type MOCK --integration-http-method OPTIONS --request-templates file://cors-template.json --no-cli-pager

# Update user face data endpoint integration
Write-Host "Updating user face data endpoint integration..."
aws apigateway put-integration --rest-api-id $apiId --resource-id $userFaceDataResourceId --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:774305584181:function:shmong-user-face-data/invocations --no-cli-pager

# Update historical matches endpoint integration
Write-Host "Updating historical matches endpoint integration..."
aws apigateway put-integration --rest-api-id $apiId --resource-id $historicalMatchesResourceId --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:774305584181:function:shmong-historical-matches/invocations --no-cli-pager

# Update historical matches OPTIONS endpoint integration for CORS
Write-Host "Updating historical matches OPTIONS endpoint integration for CORS..."
aws apigateway put-integration --rest-api-id $apiId --resource-id $historicalMatchesResourceId --http-method OPTIONS --type MOCK --integration-http-method OPTIONS --request-templates file://cors-template.json --no-cli-pager

# Update recent matches endpoint integration
Write-Host "Updating recent matches endpoint integration..."
aws apigateway put-integration --rest-api-id $apiId --resource-id $recentMatchesResourceId --http-method GET --type AWS_PROXY --integration-http-method POST --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:774305584181:function:shmong-recent-matches/invocations --no-cli-pager

# Deploy API to prod stage
Write-Host "Deploying API to prod stage..."
aws apigateway create-deployment --rest-api-id $apiId --stage-name prod --description "Updated Lambda integrations" --no-cli-pager

Write-Host "All API integrations updated successfully!" 