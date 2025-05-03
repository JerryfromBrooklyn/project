import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader, Check, Eye, EyeOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Apple HIG compliant styles (using Tailwind utility classes)
const labelStyle = "block text-sm font-medium text-gray-700 mb-0.5"; // Reduced margin
const inputStyle = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"; // Reduced padding
const selectStyle = "appearance-none block w-full pl-3 pr-10 py-2 text-base border border-gray-300 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"; // Reduced padding
const buttonPrimaryStyle = "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
const buttonSecondaryStyle = "flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"; // Smaller font
// Enhanced checkbox styles for better touch targets on mobile
const checkboxContainerStyle = "flex items-center min-h-[44px] py-1"; // Minimum 44px height per Apple HIG
const checkboxWrapperStyle = "h-10 w-10 flex items-center justify-center cursor-pointer"; // Large tap area for checkbox
const checkboxInputStyle = "appearance-none h-5 w-5 border-2 border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-offset-0 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 shrink-0 cursor-pointer"; // Increased size
const checkboxLabelStyle = "ml-1 text-sm text-gray-700 cursor-pointer select-none flex-1"; // Flex-1 to take remaining width

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
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Update viewport height on resize to ensure form adjusts properly
  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    
    // iOS-specific viewport height fix (for address bar)
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Check for agreement to terms and policies
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      setLoading(false);
      return;
    }

    if (!agreedToBiometrics) {
      setError('Please agree to the Biometrics Policy.');
      setLoading(false);
      return;
    }
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-\\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
       setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
       setLoading(false);
       return;
    }

    try {
      // Attributes for Cognito
      const attributes = {
        name: fullName,
        'custom:role': userRole, 
        'custom:agreed_to_terms': agreedToTerms.toString(),
        'custom:agreed_to_biometrics': agreedToBiometrics.toString() 
      };

      const result = await signUp(email, password, attributes);
      
      if (result.error) {
        throw result.error;
      }
      
      // Check if user needs confirmation
      if (!result.data?.userConfirmed) {
         navigate('/verify-email', { state: { email: email } });
      }
      
    } catch (err) {
      let errorMessage = 'Failed to sign up. Please check your details and try again.';
      if (err.name === 'UsernameExistsException' || (err.message && err.message.toLowerCase().includes('already exists'))) {
        errorMessage = 'An account with this email already exists.';
      } else if (err.name === 'InvalidPasswordException') {
        errorMessage = 'Password does not meet the requirements.';
      } else if (err.name === 'TooManyRequestsException') {
        errorMessage = 'Too many signup attempts. Please try again later.';
      } else if (err.message) {
         errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const generatePassword = () => {
    const length = 12; // Shorter but still secure
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+";
    const allChars = lowercase + uppercase + numbers + specialChars;
    
    let generatedPassword = "";
    
    // Ensure required characters
    generatedPassword += lowercase[Math.floor(Math.random() * lowercase.length)];
    generatedPassword += uppercase[Math.floor(Math.random() * uppercase.length)];
    generatedPassword += numbers[Math.floor(Math.random() * numbers.length)];
    generatedPassword += specialChars[Math.floor(Math.random() * specialChars.length)];
    
    // Fill remaining length
    for (let i = generatedPassword.length; i < length; i++) {
      generatedPassword += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle to avoid predictable pattern
    generatedPassword = generatedPassword.split('').sort(() => 0.5 - Math.random()).join('');
    
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
    setShowPassword(true);
    setShowConfirmPassword(true);
  };

  return (
    // Use dynamic height scaling based on viewport
    <div 
      className="flex flex-col items-center justify-center px-3 py-3 bg-gray-50"
      style={{ 
        minHeight: `${viewportHeight}px`, 
        height: 'calc(var(--vh, 1vh) * 100)', 
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch' // iOS smooth scrolling
      }}
    > 
      
      {/* Centered Card Layout - Auto-sizing for screen */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg relative flex flex-col" style={{ maxHeight: `${viewportHeight - 16}px` }}> 
        
        {/* Back to Home Link - Positioned top-left */}
        <Link 
           to="/" 
           className="absolute top-3 left-3 p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition-colors z-10"
           aria-label="Back to Home"
        >
            <ArrowLeft className="h-5 w-5" />
        </Link>

        {/* Inner Padding - Adjusted for vertical space */}
        <div className="p-4 md:p-6 flex-1 overflow-auto">

          {/* Title */}
          <h1 className="text-xl font-bold text-center text-gray-900 mb-3">Create Account</h1>

          {/* Error Message Area */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-2 rounded-md mb-3"> 
              <div className="flex items-start"> 
                <AlertCircle className="h-4 w-4 text-red-600 mr-1.5 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            </div>
          )}
            
          <form className="space-y-3" onSubmit={handleSignup}> 
            {/* Grouped Form Fields */}
            <div className="space-y-3">
              {/* 2-column layout for name and role on larger screens */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label htmlFor="full-name" className={labelStyle}>
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className={inputStyle}
                    placeholder="First and Last Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                  
                <div className="flex-1">
                  <label htmlFor="user-role" className={labelStyle}>
                    Account Type
                  </label>
                  <select
                    id="user-role"
                    name="user-role"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className={selectStyle}
                    required
                  >
                    <option value="attendee">Attendee</option>
                    <option value="photographer">Photographer</option>
                    <option value="promoter">Promoter</option>
                    <option value="venue">Venue</option>
                  </select>
                </div>
              </div>
                
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
                
              {/* Password Section with Generator */}
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label htmlFor="password" className={labelStyle}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className={buttonSecondaryStyle}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Generate Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`${inputStyle} pr-10`}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    aria-describedby="password-description"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p id="password-description" className="text-xs text-gray-500">
                  8+ characters with upper, lower, number, symbol
                </p>
              </div>
                
              <div>
                <label htmlFor="confirm-password" className={labelStyle}>
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`${inputStyle} pr-10`}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                  />
                   <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password !== confirmPassword && confirmPassword && (
                   <p className="mt-0.5 text-xs text-red-600">Passwords do not match.</p>
                )}
              </div>
            </div>

            {/* Legal Agreement Checkboxes - Updated for mobile touch */}
            <div className="space-y-4 pt-2"> 
              <div className={checkboxContainerStyle}>
                {/* Wrap checkbox in tappable div */}
                <div 
                  className={checkboxWrapperStyle} 
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                >
                  <input
                    id="terms-consent"
                    name="terms-consent"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className={checkboxInputStyle}
                    required
                  />
                </div>
                {/* Label as separate tappable zone */}
                <label 
                  htmlFor="terms-consent" 
                  className={checkboxLabelStyle}
                  onClick={() => setAgreedToTerms(!agreedToTerms)}
                >
                  <span>I agree to the </span>
                  <a 
                    href="/terms.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-medium text-blue-600 hover:underline" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    Terms & Privacy Policy
                  </a>
                </label>
              </div>

              <div className={checkboxContainerStyle}>
                {/* Wrap checkbox in tappable div */}
                <div 
                  className={checkboxWrapperStyle}
                  onClick={() => setAgreedToBiometrics(!agreedToBiometrics)}
                >
                  <input
                    id="biometrics-consent"
                    name="biometrics-consent"
                    type="checkbox"
                    checked={agreedToBiometrics}
                    onChange={(e) => setAgreedToBiometrics(e.target.checked)}
                    className={checkboxInputStyle}
                    required
                  />
                </div>
                {/* Label as separate tappable zone */}
                <label 
                  htmlFor="biometrics-consent" 
                  className={checkboxLabelStyle}
                  onClick={() => setAgreedToBiometrics(!agreedToBiometrics)}
                >
                  <span>I agree to the </span>
                  <a 
                    href="/biometrics.html" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="font-medium text-blue-600 hover:underline" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    Biometrics Policy
                  </a>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !agreedToTerms || !agreedToBiometrics || !password || password !== confirmPassword} 
                className={buttonPrimaryStyle}
              >
                {loading ? (
                  <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                ) : null}
                Create Account
              </button>
            </div>
              
            {/* Link to Login */}
            <div className="text-center text-xs">
              <span className="text-gray-600">Already have an account?</span>{' '}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:underline"
              >
                Log In
              </Link>
            </div>
          </form>
        </div> { /* End Inner Padding */}
      </div> { /* End Card */}
    </div>
  );
};

export default Signup; 