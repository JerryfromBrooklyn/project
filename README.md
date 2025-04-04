# Auth Signup Lambda Function

This Lambda function handles user signup and automatic confirmation for AWS Cognito.

## Features

- Creates new Cognito users
- Automatically confirms users (no verification email required)
- Sets custom attributes (name, role)
- Handles errors and returns proper responses

## Deployment Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a deployment package:
```bash
zip -r function.zip index.mjs package.json node_modules
```

3. Upload to AWS Lambda:
- Go to AWS Lambda console
- Create or update your function
- Upload the `function.zip` file

4. Set environment variables in AWS Lambda:
- `USER_POOL_ID`: Your Cognito User Pool ID
- `CLIENT_ID`: Your Cognito App Client ID

5. Configure API Gateway:
- Create a REST API
- Create a POST method that triggers this Lambda
- Enable CORS
- Deploy the API

## Testing

You can test this function directly in the AWS Lambda Console:

1. Create a test event with the following JSON:
```json
{
  "body": "{\"email\":\"test@example.com\",\"password\":\"Test1234!\",\"fullName\":\"Test User\",\"role\":\"attendee\"}"
}
```

2. Run the test and check the output

## Troubleshooting

- Make sure the Lambda role has permissions to call Cognito services
- Check CloudWatch logs for detailed errors
- Verify your Cognito Pool ID and Client ID are correct 