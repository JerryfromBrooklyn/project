import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Auth } from 'aws-amplify';
import { AlertCircle, UserPlus, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Password validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);

    try {
      await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
        },
      });
      
      navigate(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err.message || 'An error occurred during sign up');
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex justify-center items-center min-h-[80vh] px-4">
        <div className="w-full max-w-md">
          <div className="ios-card">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-text-primary mb-2">Create your account</h1>
              <p className="text-text-secondary">Get started with shmong</p>
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
                <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="ios-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Must be at least 8 characters
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="ios-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
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
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create account
                  </span>
                )}
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-border-light text-center">
              <p className="text-text-secondary text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary-dark font-medium">
                  Sign in <ArrowRight className="inline w-4 h-4 ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SignUp; 