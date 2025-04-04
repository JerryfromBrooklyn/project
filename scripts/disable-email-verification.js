import { CognitoIdentityProviderClient, UpdateUserPoolCommand } from '@aws-sdk/client-cognito-identity-provider';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

// Get Cognito User Pool ID from environment variables
const userPoolId = process.env.VITE_COGNITO_USER_POOL_ID;

// Check if User Pool ID is available
if (!userPoolId) {
  console.error('Error: VITE_COGNITO_USER_POOL_ID is not set in your .env file.');
  process.exit(1);
}

// Initialize Cognito client
const client = new CognitoIdentityProviderClient({
  region: process.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

// Function to disable email verification
const disableEmailVerification = async () => {
  try {
    console.log(`Attempting to disable email verification for User Pool ID: ${userPoolId}...`);

    // Define the update command
    const command = new UpdateUserPoolCommand({
      UserPoolId: userPoolId,
      // Set AutoVerifiedAttributes to an empty array to disable email verification
      // Keep other attributes as needed (e.g., phone_number if you use it)
      AutoVerifiedAttributes: [], // This disables auto-verification for email
      // Keep MfaConfiguration or other settings if they were previously configured
      // MfaConfiguration: 'OFF', // Example: Ensure MFA is off if needed
    });

    // Send the command to AWS Cognito
    const response = await client.send(command);
    console.log('Successfully disabled email verification.');
    console.log('Cognito Response:', response);

  } catch (error) {
    console.error('Error disabling email verification:', error);
    if (error.name === 'InvalidParameterException') {
      console.error('Detail: This might happen if other parameters are incorrect or missing.');
    }
  }
};

// Execute the function
disableEmailVerification(); 