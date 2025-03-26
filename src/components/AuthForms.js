import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import { Eye, EyeOff, User, Mail, Lock, X, CheckCircle, AlertCircle, UserCog, RefreshCw } from 'lucide-react';
const USER_TYPES = [
    { value: 'photographer', label: 'Photographer' },
    { value: 'promoter', label: 'Promoter' },
    { value: 'videographer', label: 'Videographer' },
    { value: 'venue', label: 'Venue' },
    { value: 'event_manager', label: 'Event Manager' },
    { value: 'attendee', label: 'Attendee' }
];
export const AuthForms = ({ defaultView = 'signin', isModal = false, onClose }) => {
    const [view, setView] = useState(defaultView);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [userType, setUserType] = useState('attendee');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [touched, setTouched] = useState({
        fullName: false,
        email: false,
        password: false,
        confirmPassword: false,
    });
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const generatePassword = () => {
        const length = 16;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let newPassword = "";
        // Ensure at least one of each required character type
        newPassword += charset.match(/[a-z]/)[0]; // lowercase
        newPassword += charset.match(/[A-Z]/)[0]; // uppercase
        newPassword += charset.match(/[0-9]/)[0]; // number
        newPassword += charset.match(/[!@#$%^&*()_+]/)[0]; // special char
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
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            if (view === 'signin') {
                const { error } = await signIn(email, password);
                if (error)
                    throw error;
            }
            else {
                const { error } = await signUp(email, password, fullName, userType);
                if (error)
                    throw error;
            }
        }
        catch (err) {
            setError(err.message || 'An error occurred');
        }
        finally {
            setLoading(false);
        }
    };
    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        }
        catch (err) {
            setError(err.message || 'An error occurred during Google sign-in');
        }
    };
    return (_jsxs("div", { className: cn("w-full max-w-md mx-auto", isModal && "relative bg-white rounded-2xl shadow-2xl overflow-hidden"), children: [isModal && (_jsx("button", { onClick: onClose, className: "absolute right-4 top-4 p-2 rounded-full bg-apple-gray-100 text-apple-gray-600 hover:bg-apple-gray-200 z-10", children: _jsx(X, { className: "w-5 h-5" }) })), _jsx("div", { className: "flex justify-center mb-6 pt-6", children: _jsxs("div", { className: "flex rounded-full overflow-hidden bg-apple-gray-200 p-1", children: [_jsx("button", { onClick: () => {
                                setView('signin');
                                setShowEmailForm(false);
                                setError(null);
                            }, className: cn("px-7 py-3 text-base font-medium transition-all duration-300 rounded-full", view === 'signin'
                                ? "bg-white text-apple-gray-900 shadow-apple-button"
                                : "bg-transparent text-apple-gray-600 hover:text-apple-gray-900"), children: "Sign In" }), _jsx("button", { onClick: () => {
                                setView('signup');
                                setShowEmailForm(false);
                                setError(null);
                            }, className: cn("px-7 py-3 text-base font-medium transition-all duration-300 rounded-full", view === 'signup'
                                ? "bg-white text-apple-gray-900 shadow-apple-button"
                                : "bg-transparent text-apple-gray-600 hover:text-apple-gray-900"), children: "Sign Up" })] }) }), _jsx("div", { className: "px-8 pb-8", children: _jsx(AnimatePresence, { mode: "wait", children: !showEmailForm ? (_jsxs(motion.div, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 }, className: "flex flex-col gap-4", children: [_jsx("h2", { className: "text-2xl font-semibold text-apple-gray-900 mb-6 text-center", children: view === 'signin' ? 'Welcome Back' : 'Create Your Account' }), error && (_jsxs("div", { className: "mb-5 p-4 bg-red-50 text-red-600 text-sm rounded-apple border border-red-100 flex items-start", children: [_jsx(AlertCircle, { className: "h-5 w-5 mr-2 mt-0.5 flex-shrink-0" }), _jsx("span", { children: error })] })), _jsxs("button", { onClick: handleGoogleSignIn, className: "flex items-center justify-center w-full py-3.5 px-4 border border-apple-gray-300 rounded-full bg-white hover:bg-apple-gray-50 transition-colors duration-300 shadow-sm", children: [_jsxs("svg", { className: "w-5 h-5 mr-2", viewBox: "0 0 24 24", children: [_jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), _jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), _jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), _jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" }), _jsx("path", { fill: "none", d: "M1 1h22v22H1z" })] }), _jsx("span", { className: "text-apple-gray-800 font-medium", children: view === 'signin' ? 'Sign in with Google' : 'Sign up with Google' })] }), _jsxs("div", { className: "relative flex items-center my-4", children: [_jsx("div", { className: "flex-grow border-t border-apple-gray-200" }), _jsx("span", { className: "flex-shrink-0 mx-4 text-apple-gray-500 text-sm", children: "or" }), _jsx("div", { className: "flex-grow border-t border-apple-gray-200" })] }), _jsx("button", { onClick: () => setShowEmailForm(true), className: "w-full ios-button-secondary", children: view === 'signin' ? 'Sign in with Email' : 'Sign up with Email' })] }, "oauth-buttons")) : (_jsxs(motion.form, { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.3 }, onSubmit: handleSubmit, className: "bg-white rounded-apple-2xl", children: [_jsx("h2", { className: "text-2xl font-semibold text-apple-gray-900 mb-6 text-center", children: view === 'signin' ? 'Sign In with Email' : 'Sign Up with Email' }), error && (_jsxs("div", { className: "mb-5 p-4 bg-red-50 text-red-600 text-sm rounded-apple border border-red-100 flex items-start", children: [_jsx(AlertCircle, { className: "h-5 w-5 mr-2 mt-0.5 flex-shrink-0" }), _jsx("span", { children: error })] })), view === 'signup' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-5", children: [_jsxs("label", { htmlFor: "fullName", className: "ios-label flex items-center", children: [_jsx(User, { className: "w-4 h-4 mr-2 text-apple-gray-500" }), "Full Name"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "fullName", type: "text", value: fullName, onChange: (e) => setFullName(e.target.value), onBlur: () => setTouched({ ...touched, fullName: true }), className: cn("ios-input pl-4", touched.fullName && !fullName.trim() && "border-apple-red-300 focus:ring-apple-red-500"), placeholder: "Your full name", required: true }), touched.fullName && fullName.trim() && (_jsx(CheckCircle, { className: "absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-apple-green-500" }))] })] }), _jsxs("div", { className: "mb-5", children: [_jsxs("label", { htmlFor: "userType", className: "ios-label flex items-center", children: [_jsx(UserCog, { className: "w-4 h-4 mr-2 text-apple-gray-500" }), "I am a..."] }), _jsxs("div", { className: "relative", children: [_jsx("select", { id: "userType", value: userType, onChange: (e) => setUserType(e.target.value), className: "ios-input pl-4 pr-10 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat", required: true, children: USER_TYPES.map(type => (_jsx("option", { value: type.value, children: type.label }, type.value))) }), _jsx(CheckCircle, { className: "absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-apple-green-500" })] })] })] })), _jsxs("div", { className: "mb-5", children: [_jsxs("label", { htmlFor: "email", className: "ios-label flex items-center", children: [_jsx(Mail, { className: "w-4 h-4 mr-2 text-apple-gray-500" }), "Email"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), onBlur: () => setTouched({ ...touched, email: true }), className: cn("ios-input pl-4", touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && "border-apple-red-300 focus:ring-apple-red-500"), placeholder: "your.email@example.com", required: true }), touched.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (_jsx(CheckCircle, { className: "absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-apple-green-500" }))] })] }), _jsxs("div", { className: "mb-5", children: [_jsxs("label", { htmlFor: "password", className: "ios-label flex items-center", children: [_jsx(Lock, { className: "w-4 h-4 mr-2 text-apple-gray-500" }), "Password"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "password", type: showPassword ? "text" : "password", value: password, onChange: (e) => setPassword(e.target.value), onBlur: () => setTouched({ ...touched, password: true }), className: cn("ios-input pr-24", touched.password && password.length < 6 && "border-apple-red-300 focus:ring-apple-red-500"), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 6 }), _jsxs("div", { className: "absolute inset-y-0 right-0 flex items-center", children: [view === 'signup' && (_jsx("button", { type: "button", onClick: generatePassword, className: "p-2 text-apple-gray-500 hover:text-apple-gray-700", title: "Generate secure password", children: _jsx(RefreshCw, { className: "h-5 w-5" }) })), _jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "p-2 text-apple-gray-500 hover:text-apple-gray-700", children: showPassword ?
                                                            _jsx(EyeOff, { className: "h-5 w-5" }) :
                                                            _jsx(Eye, { className: "h-5 w-5" }) })] }), touched.password && password.length >= 6 && (_jsx(CheckCircle, { className: "absolute right-20 top-1/2 transform -translate-y-1/2 h-5 w-5 text-apple-green-500" }))] }), view === 'signup' && (_jsx("p", { className: "mt-1 text-xs text-apple-gray-500", children: "Password must be at least 6 characters long" }))] }), view === 'signup' && (_jsxs("div", { className: "mb-5", children: [_jsxs("label", { htmlFor: "confirmPassword", className: "ios-label flex items-center", children: [_jsx(Lock, { className: "w-4 h-4 mr-2 text-apple-gray-500" }), "Confirm Password"] }), _jsxs("div", { className: "relative", children: [_jsx("input", { id: "confirmPassword", type: showConfirmPassword ? "text" : "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), onBlur: () => setTouched({ ...touched, confirmPassword: true }), className: cn("ios-input pr-12", touched.confirmPassword && password !== confirmPassword && "border-apple-red-300 focus:ring-apple-red-500"), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true, minLength: 6 }), _jsx("button", { type: "button", onClick: () => setShowConfirmPassword(!showConfirmPassword), className: "absolute inset-y-0 right-0 flex items-center px-4 text-apple-gray-500 hover:text-apple-gray-700", children: showConfirmPassword ?
                                                    _jsx(EyeOff, { className: "h-5 w-5" }) :
                                                    _jsx(Eye, { className: "h-5 w-5" }) }), touched.confirmPassword && password === confirmPassword && password.length >= 6 && (_jsx(CheckCircle, { className: "absolute right-12 top-1/2 transform -translate-y-1/2 h-5 w-5 text-apple-green-500" }))] })] })), _jsxs("div", { className: "flex flex-col space-y-4", children: [_jsx("button", { type: "submit", disabled: loading || (view === 'signup' && password !== confirmPassword), className: "w-full ios-button-primary disabled:opacity-70 disabled:cursor-not-allowed", children: loading ? (_jsxs("span", { className: "flex items-center justify-center", children: [_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), view === 'signin' ? 'Signing in...' : 'Creating account...'] })) : view === 'signin' ? ('Sign In') : ('Create Account') }), _jsx("button", { type: "button", onClick: () => setShowEmailForm(false), className: "text-apple-gray-600 hover:text-apple-gray-900 text-center py-2", children: "Back to options" })] })] }, "email-form")) }) })] }));
};
