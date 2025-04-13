import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { Eye, EyeOff, User, Mail, Lock, X, CheckCircle, AlertCircle, UserCog, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AuthFormsProps {
  defaultView?: 'signin' | 'signup';
  isModal?: boolean;
  onClose?: () => void;
}

type UserType = 'photographer' | 'promoter' | 'videographer' | 'venue' | 'attendee' | 'event_manager';

interface TouchedFields {
  fullName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

const USER_TYPES: { value: UserType; label: string }[] = [
  { value: 'photographer', label: 'Photographer' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'venue', label: 'Venue' },
  { value: 'event_manager', label: 'Event Manager' },
  { value: 'attendee', label: 'Attendee' }
];

export const AuthForms = ({ defaultView = 'signin', isModal = false, onClose }: AuthFormsProps) => {
  const [view, setView] = useState<'signin' | 'signup'>(defaultView);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<UserType>('attendee');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const generatePassword = () => {
    const length = 16;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let newPassword = "";
    
    // Ensure at least one of each required character type
    newPassword += charset.match(/[a-z]/)![0]; // lowercase
    newPassword += charset.match(/[A-Z]/)![0]; // uppercase
    newPassword += charset.match(/[0-9]/)![0]; // number
    newPassword += charset.match(/[!@#$%^&*()_+]/)![0]; // special char
    
    // Fill the rest randomly
    for (let i = newPassword.length; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('');
    
    setPassword(newPassword);
    setConfirmPassword(newPassword);
    setShowPassword(true);
    setTouched({ ...touched, password: true, confirmPassword: true });
  };

  const validateForm = () => {
    if (view === 'signup') {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (view === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        console.log('Starting signup submission...');
        const userData = { full_name: fullName, role: userType };
        const { data, error: signUpError } = await signUp(email, password, userData);
        
        if (signUpError) {
          console.error('Signup returned error:', signUpError);
          
          // Handle specific error types with user-friendly messages
          const errorMessage = (signUpError as Error).message || '';
          
          if (errorMessage.includes('connectivity') || 
              errorMessage.includes('timed out') ||
              errorMessage.includes('Network error') ||
              errorMessage.includes('SSL')) {
            throw new Error(
              'Unable to connect to authentication service. Please check your internet connection and try again.'
            );
          } else if (errorMessage.includes('credentials')) {
            throw new Error(
              'Authentication service configuration error. Please contact support.'
            );
          } else if (errorMessage.includes('Cognito configuration')) {
            throw new Error(
              'Authentication service configuration error. Please contact support.'
            );
          }
          
          throw signUpError;
        }
        console.log('Sign up API call successful:', data);
        
        if (data?.userConfirmed) {
          console.log('[AuthForms] User is confirmed. Attempting auto-login...');
          // User is confirmed (auto or previously), attempt to sign in immediately
          let signInError = null; // Define error variable
          try {
            const result = await signIn(email, password);
            signInError = result.error; // Assign error from result
            console.log('[AuthForms] Auto-login attempt result:', { error: signInError });
          } catch (err) {
            console.error('[AuthForms] Critical error during auto-login call:', err);
            signInError = err; // Assign caught error
          }
          
          if (signInError) {
            console.error('[AuthForms] Auto-login after signup failed, navigating to /login. Error:', signInError);
            // Navigate to login page as fallback if auto-login fails
            setError('Signup successful, but auto-login failed. Please log in manually.');
            navigate('/login');
          } else {
            console.log('[AuthForms] Auto-login seems successful. AuthContext should redirect to dashboard.');
            // No explicit navigation needed here - AuthContext useEffect should handle it
          }
        } else {
          console.log('User requires email verification. Navigating to verification page.');
          // User requires verification
          navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        }
      }
    } catch (err) {
      console.error('Auth form error:', err);
      
      // Format error message for display
      let errorMessage = (err as Error).message || 'An error occurred';
      
      // Handle specific AWS error codes with more user-friendly messages
      if (errorMessage.includes('UsernameExistsException')) {
        errorMessage = 'This email address is already registered. Please log in instead.';
      } else if (errorMessage.includes('InvalidPasswordException')) {
        errorMessage = 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.';
      } else if (errorMessage.includes('LimitExceededException')) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (errorMessage.includes('InternalErrorException')) {
        errorMessage = 'The authentication service is currently experiencing issues. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      setError((err as Error).message || 'An error occurred during Google sign-in');
    }
  };

  return (
    <div className={cn(
      "w-full max-w-md mx-auto bg-white", 
      isModal && "relative bg-white rounded-[28px] shadow-2xl overflow-hidden border border-gray-100"
    )}>
      {isModal && (
        <button 
          onClick={onClose}
          className="absolute right-5 top-5 p-2.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition duration-150 z-10"
          aria-label="Close"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      <div className="flex justify-center pt-8 pb-5 px-8">
        <div className="flex rounded-full overflow-hidden bg-gray-100 p-1 w-full max-w-xs">
          <button
            onClick={() => {
              setView('signin');
              setShowEmailForm(false);
              setError(null);
            }}
            className={cn(
              "flex-1 py-3.5 text-sm font-medium transition-all duration-200 rounded-full",
              view === 'signin' 
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setView('signup');
              setShowEmailForm(false);
              setError(null);
            }}
            className={cn(
              "flex-1 py-3.5 text-sm font-medium transition-all duration-200 rounded-full",
              view === 'signup'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            Sign Up
          </button>
        </div>
      </div>

      <div className="px-8 pb-8 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        <AnimatePresence mode="wait">
          {!showEmailForm ? (
            <motion.div
              key="oauth-buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-5"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 text-center">
                {view === 'signin' ? 'Welcome Back' : 'Create Your Account'}
              </h2>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start"
                >
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Only show Google button for sign in */}
              {view === 'signin' && (
                <button
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center w-full py-4 px-5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  <span className="text-gray-800 font-medium text-base">
                    Continue with Google
                  </span>
                </button>
              )}

              <div className="relative flex items-center my-6">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <button
                onClick={() => setShowEmailForm(true)}
                className="w-full py-4 px-5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-md font-medium text-base"
              >
                {view === 'signin' ? 'Continue with Email' : 'Sign up with Email'}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="bg-white"
            >
              <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6 text-center">
                {view === 'signin' ? 'Log In with Email' : 'Sign Up with Email'}
              </h2>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start"
                >
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {view === 'signup' && (
                <>
                  <div className="mb-6">
                    <label htmlFor="fullName" className="block text-base font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={() => setTouched({ ...touched, fullName: true })}
                        className={cn(
                          "block w-full p-4 pl-12 text-base border border-gray-300 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 shadow-md",
                          touched.fullName && !fullName.trim() && "border-red-300 focus:ring-red-500"
                        )}
                        placeholder="Your full name"
                        required
                      />
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      {touched.fullName && fullName.trim() && (
                        <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="userType" className="block text-base font-medium text-gray-700 mb-2">
                      I am a...
                    </label>
                    <div className="relative">
                      <select
                        id="userType"
                        value={userType}
                        onChange={(e) => setUserType(e.target.value as UserType)}
                        className="block w-full p-4 pl-12 text-base border border-gray-300 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 transition-all duration-200 appearance-none shadow-md"
                        required
                      >
                        {USER_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <UserCog className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="mb-6">
                <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched({ ...touched, email: true })}
                    className={cn(
                      "block w-full p-4 pl-12 text-base border border-gray-300 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 shadow-md",
                      touched.email && !email.trim() && "border-red-300 focus:ring-red-500"
                    )}
                    placeholder="Your email address"
                    required
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  {touched.email && email.trim() && email.includes('@') && (
                    <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-base font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched({ ...touched, password: true })}
                    className={cn(
                      "block w-full p-4 pl-12 pr-12 text-base border border-gray-300 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 shadow-md",
                      touched.password && !password.trim() && "border-red-300 focus:ring-red-500"
                    )}
                    placeholder="Your password"
                    required
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {view === 'signup' && (
                <>
                  <div className="mb-6">
                    <label htmlFor="confirmPassword" className="block text-base font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                        className={cn(
                          "block w-full p-4 pl-12 pr-12 text-base border border-gray-300 rounded-xl bg-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200 shadow-md",
                          touched.confirmPassword && password !== confirmPassword && "border-red-300 focus:ring-red-500"
                        )}
                        placeholder="Confirm your password"
                        required
                      />
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 px-4 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 flex justify-end">
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="flex items-center text-sm text-blue-500 hover:text-blue-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Generate Secure Password
                    </button>
                  </div>
                </>
              )}

              {view === 'signin' && (
                <div className="mb-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate('/reset-password')}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <div className="mb-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "w-full p-4 rounded-xl text-white font-medium relative overflow-hidden transition-all text-base shadow-md",
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : view === 'signin' ? (
                    'Log In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to options
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};