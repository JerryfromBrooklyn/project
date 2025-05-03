import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Loader, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Apple HIG compliant styles (using Tailwind utility classes)
const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
const inputStyle = "appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"; // Adjusted padding/rounding
const buttonPrimaryStyle = "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"; // Adjusted padding/font weight

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // To get state passed from other components
  const { signIn } = useAuth();

  // Check for messages passed in location state (e.g., from social login attempt)
  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
      // Clear the location state after displaying the message
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    console.log('[LOGIN] Attempting login for email:', email);

    try {
      const result = await signIn(email, password);
      console.log('[LOGIN] Sign-in result:', JSON.stringify({
          success: !result.error,
          hasData: !!result.data,
          userId: result.data?.user?.userId, // Assuming userId is the identifier
          error: result.error ? result.error.message : null
      }, null, 2));
      
      if (result.error) {
        console.error('[LOGIN] ❌ Login returned error:', result.error);
        throw result.error; // Re-throw to be caught below
      }
      
      console.log('[LOGIN] ✅ Login successful!');
      // AuthContext handles redirection upon successful login
      
    } catch (err) {
      console.error('[LOGIN] ❌ Login error caught:', err);
      let errorMessage = 'Login failed. Please check your email and password.';
      // Handle specific Cognito errors more gracefully
      if (err.name === 'UserNotFoundException') {
        errorMessage = 'No account found with this email address.';
      } else if (err.name === 'NotAuthorizedException') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.name === 'UserNotConfirmedException') {
        errorMessage = 'Account not confirmed. Please check your email for a verification link.';
        // Optionally, offer to resend confirmation
        // navigate('/resend-confirmation', { state: { email } }); 
      } else if (err.name === 'TooManyRequestsException') {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (err.message) {
        // Fallback to the error message if available and potentially useful
        errorMessage = err.message;
      }
      console.log('[LOGIN] Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
     // Use light gray background consistent with HIG
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-6 pb-6">

       {/* Centered Card Layout */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg space-y-6 relative">

        {/* Back to Home Link - Positioned top-left */}
        <Link 
           to="/" 
           className="absolute top-4 left-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
           aria-label="Back to Home"
        >
            <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Inner Padding */}
        <div className="p-6 md:p-8">

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Log In</h1>

          {/* Error Message Area */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            {/* Grouped Form Fields */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className={labelStyle}>
                  Email Address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={inputStyle}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                 <div className="flex items-center justify-between">
                    <label htmlFor="password" className={labelStyle}>
                       Password
                    </label>
                    {/* Optional: Add Forgot Password link here if needed */}
                    {/* <div className="text-sm">
                       <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                       Forgot your password?
                       </a>
                    </div> */}                  
                 </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`${inputStyle} pr-10`} // Add padding for icon
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading || !email || !password}
                className={buttonPrimaryStyle}
              >
                {loading ? (
                  <Loader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                ) : null}
                Log In
              </button>
            </div>

             {/* Link to Signup */}
             <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account?</span>{' '}
              <Link
                to="/signup"
                className="font-medium text-blue-600 hover:underline"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 