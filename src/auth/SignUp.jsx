import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const SignUp = () => {
  console.log('[SIGNUP] Rendering SignUp component');
  useEffect(() => {
    console.log('[SignUp.jsx] Mounted');
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  console.log('[SIGNUP] Component state:');
  console.log('[SIGNUP] - Loading:', loading);
  console.log('[SIGNUP] - Error:', error);
  console.log('[SIGNUP] - Success:', success);

  const validateForm = () => {
    console.log('[SIGNUP] Validating form');
    setError('');

    if (!email || !password || !confirmPassword || !fullName) {
      console.log('[SIGNUP] Validation failed: Missing required fields');
      setError('All fields are required');
      return false;
    }

    if (password !== confirmPassword) {
      console.log('[SIGNUP] Validation failed: Passwords do not match');
      setError('Passwords do not match');
      return false;
    }

    // Password strength validation
    if (password.length < 8) {
      console.log('[SIGNUP] Validation failed: Password too short');
      setError('Password must be at least 8 characters long');
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    console.log('[SIGNUP] Password validation details:');
    console.log('[SIGNUP] - Has uppercase:', hasUpperCase);
    console.log('[SIGNUP] - Has lowercase:', hasLowerCase);
    console.log('[SIGNUP] - Has numbers:', hasNumbers);
    console.log('[SIGNUP] - Has special chars:', hasSpecialChar);

    if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
      console.log('[SIGNUP] Validation failed: Password doesn\'t meet complexity requirements');
      setError('Password must contain uppercase, lowercase, number and special character');
      return false;
    }

    console.log('[SIGNUP] Form validation successful');
    return true;
  };

  const handleSubmit = async (e) => {
    console.log('[SIGNUP] Form submitted');
    e.preventDefault();

    if (!validateForm()) {
      console.log('[SIGNUP] Form validation failed, aborting submission');
      return;
    }

    console.log('[SIGNUP] Form validation passed, proceeding with signup');
    setLoading(true);
    setError('');

    try {
      console.log('[SIGNUP] Calling signUp with:');
      console.log('[SIGNUP] - Email:', email);
      console.log('[SIGNUP] - Name:', fullName);
      
      const { data, error } = await signUp(email, password, {
        name: fullName,
        email: email,
      });

      if (error) {
        console.error('[SIGNUP] Sign up returned error:', error);
        throw error;
      }

      console.log('[SIGNUP] Sign up successful:', JSON.stringify(data));
      setSuccess(true);
      
      // If email verification is required
      if (data && !data.userConfirmed) {
        console.log('[SIGNUP] User needs email verification, redirecting to verify-email page');
        console.log('[SIGNUP] Will navigate to /verify-email in 2 seconds');
        
        setTimeout(() => {
          console.log('[SIGNUP] Navigating to verify-email now');
          navigate('/verify-email', { state: { email } });
        }, 2000);
      } else {
        // If email verification is disabled or auto-confirmed
        console.log('[SIGNUP] User already confirmed, redirecting to dashboard');
        console.log('[SIGNUP] Will navigate to /dashboard in 2 seconds');
        
        setTimeout(() => {
          console.log('[SIGNUP] Navigating to dashboard now');
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err) {
      console.error('[SIGNUP] Sign up error:', err);
      console.error('[SIGNUP] Error code:', err.code);
      console.error('[SIGNUP] Error message:', err.message);
      console.error('[SIGNUP] Error stack:', err.stack);
      
      if (err.code === 'UsernameExistsException') {
        console.log('[SIGNUP] Error: Account already exists');
        setError('An account with this email already exists.');
      } else if (err.code === 'InvalidPasswordException') {
        console.log('[SIGNUP] Error: Invalid password format');
        setError(err.message || 'Password does not meet requirements.');
      } else if (err.message) {
        console.log('[SIGNUP] Error: Using error message directly');
        setError(err.message);
      } else {
        console.log('[SIGNUP] Error: Generic error message');
        setError('An error occurred during sign up. Please try again.');
      }
    } finally {
      console.log('[SIGNUP] Setting loading state to false');
      setLoading(false);
    }
  };

  if (success) {
    console.log('[SIGNUP] Rendering success state');
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-center text-green-600 mb-6">Account Created!</h2>
        <p className="text-center mb-4">
          Your account has been created successfully.
        </p>
        <p className="text-center text-gray-600">Redirecting you...</p>
      </div>
    );
  }

  console.log('[SIGNUP] Rendering sign up form');
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-6">Create an Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="fullName" className="block text-gray-700 mb-2">Full Name</label>
          <input
            id="fullName"
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={fullName}
            onChange={(e) => {
              console.log('[SIGNUP] Full name changed:', e.target.value);
              setFullName(e.target.value);
            }}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => {
              console.log('[SIGNUP] Email changed:', e.target.value);
              setEmail(e.target.value);
            }}
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => {
              console.log('[SIGNUP] Password changed (length):', e.target.value.length);
              setPassword(e.target.value);
            }}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters.
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-2">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={confirmPassword}
            onChange={(e) => {
              console.log('[SIGNUP] Confirm password changed (length):', e.target.value.length);
              setConfirmPassword(e.target.value);
            }}
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          disabled={loading}
          onClick={() => console.log('[SIGNUP] Submit button clicked')}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      
      <p className="mt-4 text-center text-gray-600">
        Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-700">Sign In</Link>
      </p>
    </div>
  );
};

export default SignUp; 