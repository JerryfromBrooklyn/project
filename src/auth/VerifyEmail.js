import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
const VerifyEmail = () => {
    // Add useEffect for mount logging
    useEffect(() => {
        console.log('[VerifyEmail.jsx] Mounted');
    }, []);
    const [code, setCode] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { confirmSignUp } = useAuth();
    useEffect(() => {
        // Get email from location state
        const stateEmail = location.state?.email;
        // Get email from URL params as fallback
        const params = new URLSearchParams(location.search);
        const urlEmail = params.get('email');
        if (stateEmail) {
            setEmail(stateEmail);
        }
        else if (urlEmail) {
            setEmail(urlEmail);
        }
        else {
            // No email found, redirect to login
            navigate('/login');
        }
    }, [location, navigate]);
    const handleVerify = async (e) => {
        e.preventDefault();
        if (!code) {
            setError('Verification code is required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data, error } = await confirmSignUp(email, code);
            if (error) {
                throw error;
            }
            setSuccess(true);
            // Redirect to login after a delay
            setTimeout(() => {
                navigate('/login', {
                    state: { message: 'Email verified successfully! You can now log in.' }
                });
            }, 3000);
        }
        catch (err) {
            console.error('Verification error:', err);
            if (err.code === 'CodeMismatchException') {
                setError('Invalid verification code. Please try again.');
            }
            else if (err.code === 'ExpiredCodeException') {
                setError('Verification code has expired. Please request a new code.');
            }
            else if (err.message) {
                setError(err.message);
            }
            else {
                setError('An error occurred during verification. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    };
    const handleResendCode = async () => {
        setResendLoading(true);
        setError('');
        setResendSuccess(false);
        try {
            // This should be implemented in your Auth context/Cognito service
            // For now, we'll just simulate success
            // await resendConfirmationCode(email);
            setResendSuccess(true);
            setTimeout(() => {
                setResendSuccess(false);
            }, 5000);
        }
        catch (err) {
            console.error('Resend code error:', err);
            setError(err.message || 'Failed to resend verification code.');
        }
        finally {
            setResendLoading(false);
        }
    };
    if (success) {
        return (_jsxs("div", { className: "max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md", children: [_jsx("h2", { className: "text-2xl font-semibold text-center text-green-600 mb-6", children: "Email Verified!" }), _jsx("p", { className: "text-center mb-4", children: "Your email has been successfully verified." }), _jsx("p", { className: "text-center text-gray-600", children: "Redirecting you to login..." })] }));
    }
    return (_jsxs("div", { className: "max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md", children: [_jsx("h2", { className: "text-2xl font-semibold text-center mb-6", children: "Verify Your Email" }), _jsxs("p", { className: "mb-6 text-gray-600 text-center", children: ["We've sent a verification code to ", _jsx("strong", { children: email }), ". Please enter the code below to verify your email address."] }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded", children: error })), resendSuccess && (_jsx("div", { className: "mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded", children: "A new verification code has been sent to your email." })), _jsxs("form", { onSubmit: handleVerify, children: [_jsxs("div", { className: "mb-6", children: [_jsx("label", { htmlFor: "code", className: "block text-gray-700 mb-2", children: "Verification Code" }), _jsx("input", { id: "code", type: "text", className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", value: code, onChange: (e) => setCode(e.target.value), placeholder: "Enter the 6-digit code", required: true })] }), _jsxs("div", { className: "flex flex-col gap-3", children: [_jsx("button", { type: "submit", className: "w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors", disabled: loading, children: loading ? 'Verifying...' : 'Verify Email' }), _jsx("button", { type: "button", className: "w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors", onClick: handleResendCode, disabled: resendLoading, children: resendLoading ? 'Sending...' : 'Resend Code' })] })] })] }));
};
export default VerifyEmail;
