import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader, Check, Eye, EyeOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Apple HIG compliant styles (using Tailwind utility classes)
const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
const inputStyle = "appearance-none block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"; // Adjusted padding/rounding
const selectStyle = "appearance-none block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"; // Adjusted padding/rounding/text size
const buttonPrimaryStyle = "w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"; // Adjusted padding/font weight
const buttonSecondaryStyle = "flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"; // Added font-medium
const checkboxContainerStyle = "flex items-start relative"; // Added relative for potential pseudo-elements if needed
const checkboxInputStyle = "appearance-none h-5 w-5 border-2 border-gray-300 rounded-sm bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-offset-0 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 shrink-0 mt-0.5 cursor-pointer"; // Added explicit border and background to ensure visibility, adjusted size
const checkboxCheckmarkStyle = "absolute top-1 left-0.5 h-5 w-5 text-white pointer-events-none"; // For potential custom checkmark
const checkboxLabelStyle = "ml-3 text-sm text-gray-700 cursor-pointer"; // Adjusted margin

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
    console.log('[SIGNUP] Validating password...');
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-\\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
       console.log('[SIGNUP] ❌ Password validation failed.');
       setError('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.');
       setLoading(false);
       return;
    }
    console.log('[SIGNUP] ✅ Password validation passed');

    try {
      console.log('[SIGNUP] Validated input, calling signUp...');
      
      // Attributes for Cognito
      const attributes = {
        name: fullName,
        'custom:role': userRole, 
        'custom:agreed_to_terms': agreedToTerms.toString(),
        'custom:agreed_to_biometrics': agreedToBiometrics.toString() 
      };

      const result = await signUp(email, password, attributes);
      
      console.log('[SIGNUP] Sign-up result:', JSON.stringify({
        success: !result.error,
        userId: result.data?.user?.userId, // Changed from 'id' based on potential Cognito structure
        userConfirmed: result.data?.userConfirmed,
        error: result.error ? result.error.message : null
      }, null, 2));
      
      if (result.error) {
        console.error('[SIGNUP] ❌ Signup returned error:', result.error);
        throw result.error; // Re-throw to be caught below
      }
      
      // Check if user needs confirmation
      if (!result.data?.userConfirmed) {
         console.log('[SIGNUP] ✅ Signup successful, user needs confirmation.');
         // Navigate to verification page, passing email as state
         navigate('/verify-email', { state: { email: email } });
      } else {
         console.log('[SIGNUP] ✅ Signup successful and confirmed!');
         // AuthContext should handle redirect for confirmed users
      }
      
    } catch (err) {
      console.error('[SIGNUP] ❌ Signup error caught:', err);
      let errorMessage = 'Failed to sign up. Please check your details and try again.';
      if (err.name === 'UsernameExistsException' || (err.message && err.message.toLowerCase().includes('already exists'))) {
        errorMessage = 'An account with this email already exists.';
      } else if (err.name === 'InvalidPasswordException') {
        errorMessage = 'Password does not meet the requirements.';
      } else if (err.name === 'TooManyRequestsException') {
        errorMessage = 'Too many signup attempts. Please try again later.';
      } else if (err.message) {
         // Try to use the error message directly if it's informative
         errorMessage = err.message;
      }
      console.log('[SIGNUP] Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const generatePassword = () => {
    const length = 16;
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*()_+"; // Reduced set for easier typing if needed
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
    setShowPassword(true); // Show generated password
    setShowConfirmPassword(true);
  };

  return (
    // Use light gray background consistent with HIG
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-6 pb-6"> 
      
      {/* Centered Card Layout - Mimicking iOS modal/sheet presentation */}
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
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">Create Account</h1>

          {/* Error Message Area */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-md"> 
              <div className="flex items-center"> 
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}
            
          <form className="space-y-5" onSubmit={handleSignup}> 
            {/* Grouped Form Fields */}
            <div className="space-y-4">
              <div>
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
                
              <div>
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
              <div className="space-y-2">
                <label htmlFor="password" className={labelStyle}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`${inputStyle} pr-10`} // Add padding for icon
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
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p id="password-description" className="text-xs text-gray-500">
                  8+ characters, uppercase, lowercase, number, special char.
                </p>
                
                {/* Generate Password Button */}
                <button
                    type="button"
                    onClick={generatePassword}
                    className={buttonSecondaryStyle}
                >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Generate Secure Password
                </button>
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
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {password !== confirmPassword && confirmPassword && (
                   <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
                )}
              </div>
            </div>

            {/* Legal Agreement Checkboxes - Updated Styles */}
            <div className="space-y-4 pt-2"> 
              <div className={checkboxContainerStyle}>
                <input
                  id="terms-consent"
                  name="terms-consent"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className={checkboxInputStyle}
                  required
                />
                {/* Optional: Add custom checkmark SVG here if needed, controlled by agreedToTerms state */}
                {/* {agreedToTerms && <Check className={checkboxCheckmarkStyle} strokeWidth={3}/>} */}
                <label htmlFor="terms-consent" className={checkboxLabelStyle}>
                  I agree to the{' '}
                  <a href="/terms.html" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                    Terms & Privacy Policy
                  </a>
                </label>
              </div>

              <div className={checkboxContainerStyle}>
                 <input
                  id="biometrics-consent"
                  name="biometrics-consent"
                  type="checkbox"
                  checked={agreedToBiometrics}
                  onChange={(e) => setAgreedToBiometrics(e.target.checked)}
                  className={checkboxInputStyle}
                  required
                />
                {/* {agreedToBiometrics && <Check className={checkboxCheckmarkStyle} strokeWidth={3}/>} */}
                <label htmlFor="biometrics-consent" className={checkboxLabelStyle}>
                  I agree to the{' '}
                  <a href="/biometrics.html" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                    Biometrics Policy
                  </a>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                // Disable button if loading, terms not agreed, or passwords don't match
                disabled={loading || !agreedToTerms || !agreedToBiometrics || !password || password !== confirmPassword} 
                className={buttonPrimaryStyle}
              >
                {loading ? (
                  <Loader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" /> // Slightly larger loader
                ) : null}
                Create Account
              </button>
            </div>
              
            {/* Link to Login */}
            <div className="text-center text-sm">
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