import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('[SIGNUP] Starting signup process...');
    console.log('[SIGNUP] Email:', email);
    console.log('[SIGNUP] Full name:', fullName);
    console.log('[SIGNUP] Password length:', password.length);

    // Password validation with detailed logging
    console.log('[SIGNUP] Validating password...');
    
    if (password.length < 8) {
      console.log('[SIGNUP] ❌ Password validation failed: too short');
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    // Check for uppercase, lowercase, numbers, and special characters
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    console.log('[SIGNUP] Password validation details:', {
      length: password.length,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecialChar
    });

    if (!(hasUppercase && hasLowercase && hasNumbers && hasSpecialChar)) {
      console.log('[SIGNUP] ❌ Password validation failed: missing required character types');
      setError('Password must contain uppercase letters, lowercase letters, numbers, and special characters');
      setLoading(false);
      return;
    }

    console.log('[SIGNUP] ✅ Password validation passed');

    try {
      console.log('[SIGNUP] Validated input, calling signUp with email:', email);
      
      // Set up a longer timeout to detect stuck calls
      const timeoutId = setTimeout(() => {
        console.error('[SIGNUP] Signup call appears to be stuck for 30s, try navigating manually');
        setError('The registration process is taking longer than expected. You may need to refresh the page.');
      }, 30000);
      
      // Call the signup function
      const result = await signUp(email, password, fullName, 'user');
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      console.log('[SIGNUP] Sign-up result:', JSON.stringify({
        success: !result.error,
        hasData: !!result.data,
        error: result.error ? result.error.message : null
      }, null, 2));
      
      // Check if this is a mock user (created as fallback)
      const isMockUser = result.data?.user?.id.startsWith('mock-') || 
                        result.data?.user?.id.startsWith('direct-') || 
                        result.data?.user?.id.startsWith('temp-');
      
      if (isMockUser) {
        console.log('[SIGNUP] Created mock user due to AWS connectivity issues');
        localStorage.setItem('MOCK_AUTH_MODE', 'true');
        
        // Update error state with a warning instead of an error
        setError('⚠️ AWS connection issue detected. Created a local account instead. Your data will be stored locally.');
      }
      
      if (result.error) {
        console.error('[SIGNUP] ❌ Signup returned error:', result.error);
        throw result.error;
      }
      
      if (!result.data) {
        console.error('[SIGNUP] ❌ No user data returned from signup');
        throw new Error('Registration failed. No user data received.');
      }

      console.log('[SIGNUP] ✅ Signup successful!', result.data);
      
      // Wait slightly longer before redirect if using mock mode to ensure the user sees the warning
      const redirectDelay = isMockUser ? 2000 : 500;
      
      setTimeout(() => {
        // Immediate navigation after successful signup
        console.log('[SIGNUP] Redirecting to dashboard');
        window.location.href = '/dashboard?test=true';
      }, redirectDelay);
      
    } catch (err) {
      console.error('[SIGNUP] ❌ Signup error:', err);
      
      // Enhanced error logging
      console.error('[SIGNUP] Error type:', err?.constructor?.name);
      console.error('[SIGNUP] Error stack:', err?.stack);
      
      // Handle specific AWS Cognito error messages
      let errorMessage = 'Failed to sign up. Please try again.';
      
      if (err.name === 'UsernameExistsException' || 
          (err.message && err.message.includes('already exists'))) {
        errorMessage = 'An account with this email already exists.';
      } else if (err.name === 'InvalidPasswordException' || 
                (err.message && err.message.includes('password'))) {
        errorMessage = err.message || 'Password does not meet requirements.';
      } else if (err.name === 'TooManyRequestsException') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (err.message && err.message.includes('timed out')) {
        // Special handling for timeout errors
        errorMessage = 'Connection to AWS timed out. The system will create a local account instead.';
        
        // Enable mock mode for timeout errors
        localStorage.setItem('MOCK_AUTH_MODE', 'true');
        
        // Try to redirect to dashboard after a delay
        setTimeout(() => {
          window.location.href = '/dashboard?test=true&error=timeout';
        }, 2000);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('[SIGNUP] Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Full name
              </label>
              <input
                id="full-name"
                name="name"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-4">
              Password must be at least 8 characters and include uppercase letters, 
              lowercase letters, numbers, and special characters.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              ) : null}
              Create account
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            By signing up, you agree to our{' '}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup; 