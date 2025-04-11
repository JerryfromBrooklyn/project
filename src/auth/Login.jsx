import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { AlertCircle, LogIn, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await Auth.signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error signing in:', err);
      if (err.code === 'UserNotConfirmedException') {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[80vh] px-4">
        <div className="w-full max-w-md">
          <div className="ios-card">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-text-primary mb-2">Welcome</h1>
              <p className="text-text-secondary">Sign in to your account</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-danger-light rounded-ios-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-danger shrink-0 mr-3 mt-0.5" />
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="ios-input"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="ios-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn className="w-5 h-5 mr-2" />
                    Sign in
                  </span>
                )}
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-border-light text-center">
              <p className="text-text-secondary text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-primary-dark font-medium">
                  Sign up <ArrowRight className="inline w-4 h-4 ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login; 