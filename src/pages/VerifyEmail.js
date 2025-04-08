import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import awsAuth from '../services/awsAuthService';
const VerifyEmail = () => {
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    // Get email from location state or ask user to enter it
    const { email } = location.state || {};
    const [emailInput, setEmailInput] = useState(email || '');
    const handleVerification = async (e) => {
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
            }
            else {
                setError('Verification failed');
            }
        }
        catch (err) {
            setError(err.message || 'An unexpected error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "w-full max-w-md space-y-8", children: [_jsxs("div", { children: [_jsx("h2", { className: "mt-6 text-center text-3xl font-bold tracking-tight text-gray-900", children: "Verify your email" }), _jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Please enter the verification code sent to your email" })] }), success ? (_jsx("div", { className: "rounded-md bg-green-50 p-4", children: _jsx("div", { className: "flex", children: _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-green-800", children: "Email verified successfully!" }), _jsx("div", { className: "mt-2 text-sm text-green-700", children: _jsx("p", { children: "Redirecting you to login page..." }) })] }) }) })) : (_jsxs("form", { className: "mt-8 space-y-6", onSubmit: handleVerification, children: [!email && (_jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: emailInput, onChange: (e) => setEmailInput(e.target.value), className: "block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" }) })] })), _jsxs("div", { children: [_jsx("label", { htmlFor: "code", className: "block text-sm font-medium text-gray-700", children: "Verification Code" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "code", name: "code", type: "text", required: true, value: verificationCode, onChange: (e) => setVerificationCode(e.target.value), className: "block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500", placeholder: "Enter verification code" }) })] }), error && (_jsx("div", { className: "rounded-md bg-red-50 p-4", children: _jsx("div", { className: "flex", children: _jsxs("div", { className: "ml-3", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Verification failed" }), _jsx("div", { className: "mt-2 text-sm text-red-700", children: _jsx("p", { children: error }) })] }) }) })), _jsx("div", { children: _jsx("button", { type: "submit", disabled: loading, className: "group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-75", children: loading ? 'Verifying...' : 'Verify Email' }) }), _jsx("div", { className: "text-sm text-center", children: _jsx("button", { type: "button", onClick: () => navigate('/login'), className: "font-medium text-indigo-600 hover:text-indigo-500", children: "Back to login" }) })] }))] }) }));
};
export default VerifyEmail;
