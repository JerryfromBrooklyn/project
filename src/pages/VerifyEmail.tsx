import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import awsAuth from '../services/awsAuthService';

const VerifyEmail: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get email from location state or ask user to enter it
  const { email } = (location.state as { email: string }) || {};
  const [emailInput, setEmailInput] = useState(email || '');
  
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput) {
      setError('Email is required');
      return;
    }
    
    if (!verificationCode) {
      setError('Verification code is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await awsAuth.confirmSignUp(emailInput, verificationCode);
      
      if (error) {
        setError(error.message || 'Verification failed');
        setLoading(false);
        return;
      }
      
      if (data.success) {
        setSuccess(true);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { state: { message: 'Email verified successfully! You can now log in.' } });
        }, 3000);
      } else {
        setError('Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the verification code sent to your email
          </p>
        </div>
        
        {success ? (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Email verified successfully!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Redirecting you to login page...</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleVerification}>
            {!email && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <div className="mt-1">
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Enter verification code"
                />
              </div>
            </div>
            
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Verification failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
            
            <div className="text-sm text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Back to login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 