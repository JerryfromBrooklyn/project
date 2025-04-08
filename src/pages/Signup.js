import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        console.log('[SIGNUP] Starting signup process...');
        console.log('[SIGNUP] Email:', email);
        console.log('[SIGNUP] Full name:', fullName);
        console.log('[SIGNUP] Password length:', password.length);
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
            // Call the signup function - navigation is now handled in AuthContext
            const result = await signUp(email, password, fullName, 'attendee');
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
        }
        catch (err) {
            console.error('[SIGNUP] ❌ Signup error:', err);
            // Enhanced error logging
            console.error('[SIGNUP] Error type:', err?.constructor?.name);
            console.error('[SIGNUP] Error stack:', err?.stack);
            // Handle specific AWS Cognito error messages
            let errorMessage = 'Failed to sign up. Please try again.';
            if (err.name === 'UsernameExistsException' ||
                (err.message && err.message.includes('already exists'))) {
                errorMessage = 'An account with this email already exists.';
            }
            else if (err.name === 'InvalidPasswordException' ||
                (err.message && err.message.includes('password'))) {
                errorMessage = err.message || 'Password does not meet requirements.';
            }
            else if (err.name === 'TooManyRequestsException') {
                errorMessage = 'Too many requests. Please try again later.';
            }
            else if (err.message) {
                errorMessage = err.message;
            }
            console.log('[SIGNUP] Setting error message:', errorMessage);
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-md w-full space-y-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "Create your account" }), _jsxs("p", { className: "mt-2 text-center text-sm text-gray-600", children: ["Or", ' ', _jsx(Link, { to: "/login", className: "font-medium text-blue-600 hover:text-blue-500", children: "sign in to your existing account" })] })] }), error && (_jsx("div", { className: "bg-red-50 border-l-4 border-red-500 p-4 mb-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx(AlertCircle, { className: "h-5 w-5 text-red-500 mr-2 flex-shrink-0" }), _jsx("p", { className: "text-sm text-red-700", children: error })] }) })), _jsxs("form", { className: "mt-8 space-y-6", onSubmit: handleSignup, children: [_jsxs("div", { className: "rounded-md shadow-sm -space-y-px", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "full-name", className: "sr-only", children: "Full name" }), _jsx("input", { id: "full-name", name: "name", type: "text", autoComplete: "name", required: true, className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm", placeholder: "Full name", value: fullName, onChange: (e) => setFullName(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "email-address", className: "sr-only", children: "Email address" }), _jsx("input", { id: "email-address", name: "email", type: "email", autoComplete: "email", required: true, className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm", placeholder: "Email address", value: email, onChange: (e) => setEmail(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "sr-only", children: "Password" }), _jsx("input", { id: "password", name: "password", type: "password", autoComplete: "new-password", required: true, className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm", placeholder: "Password (min. 8 characters)", value: password, onChange: (e) => setPassword(e.target.value), minLength: 8 })] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500 mb-4", children: "Password must be at least 8 characters and include uppercase letters, lowercase letters, numbers, and special characters." }), _jsxs("button", { type: "submit", disabled: loading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: [loading ? (_jsx(Loader, { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white" })) : null, "Create account"] })] }), _jsxs("div", { className: "text-xs text-gray-500 text-center", children: ["By signing up, you agree to our", ' ', _jsx(Link, { to: "/terms", className: "text-blue-600 hover:text-blue-500", children: "Terms of Service" }), ' ', "and", ' ', _jsx(Link, { to: "/privacy", className: "text-blue-600 hover:text-blue-500", children: "Privacy Policy" })] })] })] }) }));
};
export default Signup;
