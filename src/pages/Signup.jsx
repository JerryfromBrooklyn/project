import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader, Check, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState('attendee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToBiometrics, setAgreedToBiometrics] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    console.log('[SIGNUP] Starting signup process...');
    console.log('[SIGNUP] Email:', email);
    console.log('[SIGNUP] Full name:', fullName);
    console.log('[SIGNUP] User role:', userRole);
    console.log('[SIGNUP] Password length:', password.length);
    console.log('[SIGNUP] Terms agreement:', agreedToTerms);
    console.log('[SIGNUP] Biometrics agreement:', agreedToBiometrics);

    // Check for agreement to terms and policies
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      setLoading(false);
      return;
    }

    if (!agreedToBiometrics) {
      setError('You must agree to the Biometrics Policy');
      setLoading(false);
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

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
      
      // Fix the way we're sending attributes to signUp - pass them as separate parameters instead of an object
      const result = await signUp(
        email, 
        password, 
        fullName,
        userRole,
        {
          agreedToTerms: agreedToTerms,
          agreedToBiometrics: agreedToBiometrics
        }
      );
      
      console.log('[SIGNUP] Sign-up result:', JSON.stringify({
        success: !result.error,
        hasData: !!result.data,
        error: result.error ? result.error.message : null
      }, null, 2));
      
      if (result.error) {
        console.error('[SIGNUP] ❌ Signup returned error:', result.error);
        throw result.error;
      }
      
      if (!result.data) {
        console.error('[SIGNUP] ❌ No user data returned from signup');
        throw new Error('Registration failed. No user data received.');
      }

      console.log('[SIGNUP] ✅ Signup successful!', result.data);
      // No need for redirection here - it's handled in AuthContext
      
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
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('[SIGNUP] Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBackClick = () => {
    navigate('/');
  };
  
  const generatePassword = () => {
    const length = 16;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+";
    const charset = lowercase + uppercase + numbers + specialChars;
    
    let newPassword = "";
    
    // Ensure at least one of each required character type
    newPassword += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    newPassword += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    newPassword += numbers.charAt(Math.floor(Math.random() * numbers.length));
    newPassword += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    
    // Fill the rest randomly
    for (let i = newPassword.length; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('');
    
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with back button */}
      <header className="py-4 px-6 flex items-center border-b border-gray-200">
        <button 
          onClick={handleBackClick}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Go back"
        >
          <X className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold text-center flex-1 mr-8">Create Account</h1>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-auto">
        <div className="max-w-md w-full space-y-8">
          {error && (
            <div className="bg-red-50 p-4 rounded-xl shadow-sm mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <input
                  id="full-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="user-role" className="block text-sm font-medium text-gray-700 mb-1">
                  I am a...
                </label>
                <select
                  id="user-role"
                  name="user-role"
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="attendee">Attendee</option>
                  <option value="photographer">Photographer</option>
                  <option value="promoter">Promoter</option>
                  <option value="venue">Venue</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character.
                </p>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Generate a secure password
                </button>
              </div>
            </div>

            {/* Legal agreement checkboxes */}
            <div className="space-y-4 pt-4">
              <h2 className="text-sm font-medium text-gray-700">Legal Agreements</h2>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="relative">
                    <input
                      id="terms-consent"
                      name="terms-consent"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 rounded appearance-none cursor-pointer checked:bg-blue-600 checked:border-blue-600"
                    />
                    {agreedToTerms && (
                      <Check className="absolute inset-0 h-5 w-5 text-white pointer-events-none" />
                    )}
                  </div>
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms-consent" className="font-medium text-gray-700 cursor-pointer">
                    I agree to the{' '}
                    <Link to="/terms-of-service-and-privacy-policy" target="_blank" className="text-blue-600 hover:text-blue-500">
                      Terms of Service and Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="relative">
                    <input
                      id="biometrics-consent"
                      name="biometrics-consent"
                      type="checkbox"
                      checked={agreedToBiometrics}
                      onChange={(e) => setAgreedToBiometrics(e.target.checked)}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-2 border-gray-300 rounded appearance-none cursor-pointer checked:bg-blue-600 checked:border-blue-600"
                    />
                    {agreedToBiometrics && (
                      <Check className="absolute inset-0 h-5 w-5 text-white pointer-events-none" />
                    )}
                  </div>
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="biometrics-consent" className="font-medium text-gray-700 cursor-pointer">
                    I agree to the{' '}
                    <Link to="/biometrics-policy" target="_blank" className="text-blue-600 hover:text-blue-500">
                      Biometrics Policy
                    </Link>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !agreedToTerms || !agreedToBiometrics || password !== confirmPassword}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                ) : null}
                Create account
              </button>
            </div>
            
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account?</span>{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Add Footer at bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default Signup; 