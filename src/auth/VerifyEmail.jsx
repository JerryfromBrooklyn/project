import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { KeyRound, AlertCircle, Check, ArrowRight, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Get email from URL query parameter
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    
    if (emailParam) {
      setEmail(emailParam);
    } else if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!code || !email) {
      setError('Please enter your verification code');
      return;
    }
    
    setLoading(true);
    
    try {
      await Auth.confirmSignUp(email, code);
      setSuccess(true);
      
      // Redirect to login after successful verification
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error confirming sign up:', err);
      setError(err.message || 'Failed to verify your email. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendCode = async () => {
    setError('');
    setResendSuccess(false);
    
    if (!email) {
      setError('Email address is required');
      return;
    }
    
    setResendLoading(true);
    
    try {
      await Auth.resendSignUp(email);
      setResendSuccess(true);
      
      // Clear resend success message after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error resending code:', err);
      setError(err.message || 'Failed to resend verification code');
    } finally {
      setResendLoading(false);
    }
  };
  
  if (success) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[80vh] px-4">
          <div className="w-full max-w-md">
            <div className="ios-card">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-success-light rounded-full flex items-center justify-center mb-6">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h1 className="text-2xl font-semibold text-text-primary mb-2">Email Verified!</h1>
                <p className="text-text-secondary mb-6">Your account has been successfully verified</p>
                
                <p className="text-sm text-text-secondary">
                  Redirecting you to login...
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[80vh] px-4">
        <div className="w-full max-w-md">
          <div className="ios-card">
            <div className="text-center mb-8">
              <div className="mx-auto h-16 w-16 bg-primary-light rounded-full flex items-center justify-center mb-4">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-text-primary mb-2">Verify your email</h1>
              <p className="text-text-secondary">
                We've sent a code to {email || 'your email'}
              </p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-danger-light rounded-ios-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-danger shrink-0 mr-3 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}
            
            {resendSuccess && (
              <div className="mb-6 p-4 bg-success-light rounded-ios-lg flex items-start">
                <Check className="w-5 h-5 text-success shrink-0 mr-3 mt-0.5" />
                <p className="text-sm text-success">Verification code resent successfully</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-text-secondary mb-2">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="ios-input"
                  placeholder="Enter code"
                  autoComplete="one-time-code"
                />
              </div>
              
              <button
                type="submit"
                className="ios-button-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Verify Email <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                )}
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-border-light text-center">
              <p className="text-text-secondary text-sm mb-4">
                Didn't receive a code?
              </p>
              <button
                onClick={handleResendCode}
                className="ios-button-secondary"
                disabled={resendLoading}
              >
                {resendLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></span>
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail; 