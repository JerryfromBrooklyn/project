import { SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand, GlobalSignOutCommand, GetUserCommand, AuthFlowType, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, AWS_REGION } from '../lib/awsClient';
import { createUserRecord } from './database-utils';
// Flag to bypass email verification for testing
export const BYPASS_EMAIL_VERIFICATION = true;
// Auth state
let currentUser = null;
let currentSession = null;
const listeners = [];
// Add auth state listener
export const onAuthStateChange = (callback) => {
    listeners.push(callback);
    // Return an unsubscribe function
    return {
        unsubscribe: () => {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    };
};
// Notify listeners of auth state changes
const notifyAuthChange = (user) => {
    currentUser = user;
    listeners.forEach(listener => listener(user));
};
// Get current session
export const getSession = async () => {
    try {
        if (!currentSession) {
            // No active session in memory, check local storage
            const sessionData = localStorage.getItem('aws_auth_session');
            if (sessionData) {
                const sessionObj = JSON.parse(sessionData);
                // Check if token is expired
                if (sessionObj.expiresAt && new Date(sessionObj.expiresAt) > new Date()) {
                    currentSession = sessionObj;
                    // Get user details with the token
                    const user = await getCurrentUser();
                    if (user) {
                        notifyAuthChange(user);
                    }
                }
            }
        }
        return { data: { session: currentSession }, error: null };
    }
    catch (error) {
        console.error('Error getting session:', error);
        return { data: { session: null }, error };
    }
};
// Get current user
export const getCurrentUser = async () => {
    try {
        if (!currentSession || !currentSession.accessToken) {
            return null;
        }
        const command = new GetUserCommand({
            AccessToken: currentSession.accessToken
        });
        const response = await cognitoClient.send(command);
        if (!response || !response.UserAttributes) {
            return null;
        }
        // Extract user attributes
        const attributes = {};
        response.UserAttributes.forEach(attr => {
            if (attr.Name && attr.Value) {
                attributes[attr.Name] = attr.Value;
            }
        });
        const user = {
            id: attributes.sub || '',
            email: attributes.email || '',
            full_name: attributes.name,
            role: attributes['custom:role'],
            created_at: attributes['custom:created_at'],
            updated_at: attributes['custom:updated_at']
        };
        currentUser = user;
        return user;
    }
    catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};
// Sign in with email and password
export const signInWithPassword = async (email, password) => {
    try {
        const command = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            ClientId: COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
                PASSWORD: password
            }
        });
        const response = await cognitoClient.send(command);
        if (!response.AuthenticationResult) {
            throw new Error('Authentication failed');
        }
        // Store session data
        const session = {
            accessToken: response.AuthenticationResult.AccessToken,
            refreshToken: response.AuthenticationResult.RefreshToken,
            idToken: response.AuthenticationResult.IdToken,
            expiresAt: new Date(Date.now() + (response.AuthenticationResult.ExpiresIn || 3600) * 1000).toISOString()
        };
        currentSession = session;
        localStorage.setItem('aws_auth_session', JSON.stringify(session));
        
        // Get user details
        const user = await getCurrentUser();
        
        // Also store user in localStorage directly for redundant persistence
        if (user) {
            localStorage.setItem('authUser', JSON.stringify(user));
        }
        
        notifyAuthChange(user);
        return { data: { user, session }, error: null };
    }
    catch (error) {
        console.error('Sign in error:', error);
        return { data: { user: null, session: null }, error };
    }
};
// Sign up with email and password
export const signUp = async (email, password, userData = {}) => {
    console.log('[AUTH] Starting sign-up process for email:', email);
    console.log('[AUTH] User data provided:', JSON.stringify(userData, null, 2));
    try {
        // Basic validation
        if (!email || !password) {
            throw new Error('Email and password are required');
        }
        // Check for empty credentials first
        if (!COGNITO_CLIENT_ID || !COGNITO_USER_POOL_ID) {
            console.error('[AUTH] Cognito configuration is missing');
            throw new Error('Cognito configuration is missing. Please check your environment variables.');
        }
        // Prepare user attributes for Cognito
        console.log('[AUTH] Preparing user attributes');
        const userAttributes = [
            { Name: 'email', Value: email },
        ];
        // Add additional user data
        if (userData.full_name) {
            console.log('[AUTH] Adding full_name attribute:', userData.full_name);
            userAttributes.push({ Name: 'name', Value: userData.full_name });
        }
        if (userData.role) {
            console.log('[AUTH] Adding role attribute:', userData.role);
            userAttributes.push({ Name: 'custom:role', Value: userData.role });
        }
        // Create the signup command
        const command = new SignUpCommand({
            ClientId: COGNITO_CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: userAttributes
        });
        console.log('[AUTH] Sending SignUpCommand to Cognito');
        const response = await cognitoClient.send(command);
        console.log('[AUTH] AWS SDK method successful!');
        console.log('[AUTH] Response:', JSON.stringify(response, null, 2));
        // If successful, create the user and return
        if (response.UserSub) {
            const user = {
                id: response.UserSub,
                email,
                full_name: userData.full_name,
                role: userData.role,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            // Create user in DynamoDB
            try {
                await createUserRecord(user);
                console.log('[AUTH] User record created in DynamoDB');
            }
            catch (dbErr) {
                console.error('[AUTH] DynamoDB error (non-critical):', dbErr);
            }
            
            // Store the user in localStorage to ensure persistence
            localStorage.setItem('authUser', JSON.stringify(user));
            currentUser = user;
            notifyAuthChange(user);
            
            // Auto-confirm user if bypass flag is enabled
            if (BYPASS_EMAIL_VERIFICATION && !response.UserConfirmed) {
                try {
                    console.log('[AUTH] Bypassing email verification - auto-confirming user');
                    const confirmCommand = new AdminConfirmSignUpCommand({
                        UserPoolId: COGNITO_USER_POOL_ID,
                        Username: email
                    });
                    await cognitoClient.send(confirmCommand);
                    console.log('[AUTH] User auto-confirmed successfully');
                    // Override the UserConfirmed flag
                    response.UserConfirmed = true;
                    
                    // Auto sign-in after confirmation
                    console.log('[AUTH] Auto-signing in after confirmation');
                    try {
                        const signInCommand = new InitiateAuthCommand({
                            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
                            ClientId: COGNITO_CLIENT_ID,
                            AuthParameters: {
                                USERNAME: email,
                                PASSWORD: password
                            }
                        });
                        const signInResponse = await cognitoClient.send(signInCommand);
                        
                        if (signInResponse.AuthenticationResult) {
                            // Store session data
                            const session = {
                                accessToken: signInResponse.AuthenticationResult.AccessToken,
                                refreshToken: signInResponse.AuthenticationResult.RefreshToken,
                                idToken: signInResponse.AuthenticationResult.IdToken,
                                expiresAt: new Date(Date.now() + (signInResponse.AuthenticationResult.ExpiresIn || 3600) * 1000).toISOString()
                            };
                            currentSession = session;
                            localStorage.setItem('aws_auth_session', JSON.stringify(session));
                            console.log('[AUTH] Auto sign-in successful');
                        }
                    } catch (signInErr) {
                        console.error('[AUTH] Auto sign-in failed:', signInErr);
                        // Continue even if auto-signin fails - the account is still created
                    }
                }
                catch (confirmErr) {
                    console.error('[AUTH] Error auto-confirming user:', confirmErr);
                    // Continue even if this fails - the user is still created
                }
            }
            return {
                data: {
                    user,
                    userConfirmed: response.UserConfirmed
                },
                error: null
            };
        }
        else {
            throw new Error('Failed to create user account');
        }
    }
    catch (error) {
        console.error('[AUTH] Sign-up error:', error);
        // Enhanced error logging
        if (error instanceof Error) {
            console.error('[AUTH] Error name:', error.name);
            console.error('[AUTH] Error message:', error.message);
        }
        // AWS specific error details if available
        if (error.$metadata) {
            console.error('[AUTH] AWS error metadata:', JSON.stringify(error.$metadata, null, 2));
        }
        // Check for common Cognito errors and provide user-friendly messages
        let finalError = error;
        if (error instanceof Error) {
            if (error.name === 'UsernameExistsException' || error.message.includes('exists')) {
                finalError = new Error('An account with this email already exists.');
            }
            else if (error.name === 'InvalidPasswordException' || error.message.includes('password')) {
                finalError = new Error('Password does not meet requirements. It must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.');
            }
        }
        console.error('[AUTH] Returning error from signup process');
        return {
            data: {
                user: null,
                userConfirmed: false
            },
            error: finalError
        };
    }
};
// Confirm sign up (verification code)
export const confirmSignUp = async (email, code) => {
    try {
        const command = new ConfirmSignUpCommand({
            ClientId: COGNITO_CLIENT_ID,
            Username: email,
            ConfirmationCode: code
        });
        await cognitoClient.send(command);
        return { data: { success: true }, error: null };
    }
    catch (error) {
        console.error('Confirm sign up error:', error);
        return { data: { success: false }, error };
    }
};
// Resend confirmation code
export const resendConfirmationCode = async (email) => {
    try {
        // Import dynamically to avoid issues with circular dependencies
        const { ResendConfirmationCodeCommand } = await import('@aws-sdk/client-cognito-identity-provider');
        const command = new ResendConfirmationCodeCommand({
            ClientId: COGNITO_CLIENT_ID,
            Username: email
        });
        await cognitoClient.send(command);
        return { data: { success: true }, error: null };
    }
    catch (error) {
        console.error('Resend confirmation code error:', error);
        return { data: { success: false }, error };
    }
};
// Sign out
export const signOut = async () => {
    try {
        if (currentSession && currentSession.accessToken) {
            const command = new GlobalSignOutCommand({
                AccessToken: currentSession.accessToken
            });
            await cognitoClient.send(command);
        }
        // Clear local session data
        currentSession = null;
        localStorage.removeItem('aws_auth_session');
        // Notify listeners
        notifyAuthChange(null);
        return { error: null };
    }
    catch (error) {
        console.error('Sign out error:', error);
        return { error };
    }
};
// Test AWS connectivity - can be used to check if AWS services are reachable
export const testAwsConnectivity = async () => {
    console.log('[AUTH] Testing AWS Cognito connectivity...');
    try {
        console.log('[AUTH] AWS Region:', AWS_REGION);
        console.log('[AUTH] Cognito User Pool ID:', COGNITO_USER_POOL_ID);
        console.log('[AUTH] Cognito Client ID:', COGNITO_CLIENT_ID);
        // Check for empty credentials
        const accessKeyAvailable = !!(process.env.VITE_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID);
        const secretKeyAvailable = !!(process.env.VITE_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY);
        console.log('[AUTH] AWS Access Key available:', accessKeyAvailable);
        console.log('[AUTH] AWS Secret Key available:', secretKeyAvailable);
        if (!accessKeyAvailable || !secretKeyAvailable) {
            console.error('[AUTH] AWS credentials are missing');
            return {
                success: false,
                error: 'AWS credentials are missing'
            };
        }
        if (!COGNITO_CLIENT_ID || !COGNITO_USER_POOL_ID) {
            console.error('[AUTH] Cognito configuration is missing');
            return {
                success: false,
                error: 'Cognito configuration is missing'
            };
        }
        // Instead of using ListUserPoolsCommand which might require extra permissions,
        // we'll just try to use the SignUpCommand directly with invalid data to check connectivity
        // This will fail with a validation error, but that means we can reach AWS
        const command = new SignUpCommand({
            ClientId: COGNITO_CLIENT_ID,
            Username: 'test-connectivity-' + Date.now(),
            Password: 'Password1!',
            UserAttributes: []
        });
        const startTime = new Date().getTime();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Connection to AWS Cognito timed out after 10 seconds'));
            }, 10000);
        });
        // Race between the actual request and the timeout
        try {
            await Promise.race([
                cognitoClient.send(command),
                timeoutPromise
            ]);
            // This should never be reached because the SignUp will fail with validation errors
            console.error('[AUTH] Unexpected success in connectivity test');
        }
        catch (err) {
            // Check if this is a timeout error or AWS validation error
            if (err instanceof Error && err.message.includes('timed out')) {
                throw err; // Re-throw timeout errors
            }
            // If we get ANY response from AWS (even an error), it means connectivity is working
            console.log('[AUTH] Received response from AWS (expected validation error):', err);
            // Check if this is an AWS service error or a network error
            if (err.$metadata && err.$metadata.httpStatusCode) {
                // This is an AWS service error, which means we successfully connected to AWS
                console.log('[AUTH] Successfully connected to AWS (got HTTP status code)');
                const endTime = new Date().getTime();
                console.log(`[AUTH] AWS Cognito connectivity test completed successfully in ${endTime - startTime}ms`);
                return { success: true, latency: endTime - startTime };
            }
            else {
                // This is some other error, might be network related
                console.error('[AUTH] Network or other error during connectivity test:', err);
                throw err;
            }
        }
        // This code shouldn't be reached
        return { success: false, error: 'Unknown error in connectivity test' };
    }
    catch (error) {
        console.error('[AUTH] AWS Cognito connectivity test failed:', error);
        if (error instanceof Error) {
            console.error('[AUTH] Error name:', error.name);
            console.error('[AUTH] Error message:', error.message);
            console.error('[AUTH] Error stack:', error.stack);
        }
        // Check for specific error types
        let errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('NetworkError') || errorMessage.includes('Network Error')) {
            errorMessage = 'Network error connecting to AWS. Please check your internet connection.';
        }
        else if (errorMessage.includes('timed out')) {
            errorMessage = 'Connection to AWS timed out. The service might be unavailable.';
        }
        else if (errorMessage.includes('credentials')) {
            errorMessage = 'Invalid AWS credentials. Please check your access keys.';
        }
        else if (errorMessage.includes('SSL')) {
            errorMessage = 'SSL/TLS error connecting to AWS. Check your network security settings.';
        }
        return {
            success: false,
            error: errorMessage,
            details: error
        };
    }
};
export default {
    getSession,
    getCurrentUser,
    signInWithPassword,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    signOut,
    onAuthStateChange
};
