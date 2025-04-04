import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { confirmSignUp, resendConfirmationCode } from '../services/awsAuthService';
import { AlertCircle, Loader, CheckCircle, Mail } from 'lucide-react';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Try to get email from state first (from newer redirects)
    const stateEmail = location.state?.email;
    
    // Then try from query params (backward compatibility)
    const params = new URLSearchParams(location.search);
    const urlEmail = params.get('email');
    
    // Use whichever is available
    if (stateEmail) {
      console.log('[VERIFY] Email from state:', stateEmail);
      setEmail(stateEmail);
    } else if (urlEmail) {
      console.log('[VERIFY] Email from URL params:', urlEmail);
      setEmail(urlEmail);
    } else {
      // If no email provided, redirect to login
      console.log('[VERIFY] No email found, redirecting to login');
      navigate('/login');
    }
  }, [location, navigate]);
  
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await confirmSignUp(email, code);
      
      if (error) {
        throw error;
      }
      
      // Set success and redirect after a delay
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setResendLoading(true);
    setError(null);
    setResendSuccess(false);
    
    try {
      const { error } = await resendConfirmationCode(email);
      
      if (error) {
        throw error;
      }
      
      setResendSuccess(true);
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Resend code error:', err);
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-4">Your account has been successfully verified.</p>
          <p className="text-gray-500">Redirecting you to login...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="h-12 w-12 text-blue-500 mx-auto" />
          <h2 className="mt-4 text-center text-2xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification code to <span className="font-medium">{email}</span>
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
        
        {resendSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
              <p className="text-sm text-green-700">Verification code resent successfully!</p>
            </div>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div>
            <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              id="verification-code"
              name="code"
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              ) : null}
              Verify Email
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <button
            onClick={handleResendCode}
            disabled={resendLoading}
            className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center mx-auto"
          >
            {resendLoading ? (
              <Loader className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" />
            ) : null}
            Didn't receive a code? Resend
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 