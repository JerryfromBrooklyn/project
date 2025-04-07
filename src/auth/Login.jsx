import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const Login = () => {
  console.log('[LOGIN] Rendering Login component');
  // Add useEffect for mount logging
  useEffect(() => {
    console.log('[Login.jsx] Mounted');
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  
  // Get any "from" location passed in state (the page they were trying to access)
  const from = location.state?.from?.pathname || '/dashboard';
  console.log('[LOGIN] Redirect destination after login:', from);
  
  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      console.log('[LOGIN] User already authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Check for any success messages passed in location state
  useEffect(() => {
    console.log('[LOGIN] Checking for location state messages');
    if (location.state?.message) {
      console.log('[LOGIN] Message found in location state:', location.state.message);
      setMessage(location.state.message);
      
      // Clear the location state
      console.log('[LOGIN] Clearing location state');
      window.history.replaceState({}, document.title);
      
      // Auto-clear message after 5 seconds
      console.log('[LOGIN] Setting up auto-clear timer for message');
      const timer = setTimeout(() => {
        console.log('[LOGIN] Auto-clearing message');
        setMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);
  
  const handleSubmit = async (e) => {
    console.log('[LOGIN] Form submitted');
    e.preventDefault();
    
    if (!email || !password) {
      console.log('[LOGIN] Validation failed: Missing email or password');
      setError('Email and password are required');
      return;
    }
    
    console.log('[LOGIN] Form validation passed, proceeding with login');
    console.log('[LOGIN] Email:', email);
    setLoading(true);
    setError('');
    
    try {
      console.log('[LOGIN] Calling signIn');
      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('[LOGIN] Sign in returned error:', error);
        throw error;
      }
      
      console.log('[LOGIN] Sign in successful:', data?.user?.id);
      console.log('[LOGIN] Navigating to:', from);
      
      // Navigate to original destination or dashboard on successful login
      navigate(from, { replace: true });
    } catch (err) {
      console.error('[LOGIN] Login error:', err);
      console.error('[LOGIN] Error code:', err.code);
      console.error('[LOGIN] Error message:', err.message);
      console.error('[LOGIN] Error stack:', err.stack);
      
      if (err.code === 'NotAuthorizedException') {
        console.log('[LOGIN] Error: Incorrect credentials');
        setError('Incorrect username or password.');
      } else if (err.code === 'UserNotConfirmedException') {
        console.log('[LOGIN] Error: User not confirmed, redirecting to verification');
        // Redirect to verification page if user is not confirmed
        navigate(`/verify-email`, { state: { email } });
      } else if (err.message) {
        console.log('[LOGIN] Error: Using error message directly');
        setError(err.message);
      } else {
        console.log('[LOGIN] Error: Generic error message');
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      console.log('[LOGIN] Setting loading state to false');
      setLoading(false);
    }
  };
  
  console.log('[LOGIN] Component state:');
  console.log('[LOGIN] - Loading:', loading);
  console.log('[LOGIN] - Error:', error);
  console.log('[LOGIN] - Message:', message);
  
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-6">Sign In</h2>
      
      {message && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">Email Address</label>
          <input
            id="email"
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => {
              console.log('[LOGIN] Email changed:', e.target.value);
              setEmail(e.target.value);
            }}
            required
          />
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-sm text-blue-500 hover:text-blue-700">
              Forgot Password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => {
              console.log('[LOGIN] Password changed (length):', e.target.value.length);
              setPassword(e.target.value);
            }}
            required
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
          disabled={loading}
          onClick={() => console.log('[LOGIN] Submit button clicked')}
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <p className="mt-4 text-center text-gray-600">
        Don't have an account? <Link to="/signup" className="text-blue-500 hover:text-blue-700">Sign Up</Link>
      </p>
    </div>
  );
};

export default Login; 