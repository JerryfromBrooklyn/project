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
        if (!validateForm()) {
            return;
        }
        setLoading(true);
        try {
            if (view === 'signin') {
                const { error } = await signIn(email, password);
                if (error)
                    throw error;
                // Sign in handles navigation automatically in AuthContext
            }
            else {
                const { error } = await signUp(email, password, fullName, userType);
                if (error)
                    throw error;
                    
                // Navigate to dashboard after successful signup
                setError(null);
                
                // Switch to signin view
                setView('signin');
                setShowEmailForm(true);
                
                // Pre-fill the email field for convenience
                // Password will need to be entered again for security
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
    return (
        <div className={cn(
            "w-full max-w-md mx-auto",
            isModal && "relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
        )}>
            {isModal && (
                <button 
                    onClick={onClose} 
                    className="absolute right-4 top-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            <div className="pt-8 px-8">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-center mb-8"
                >
                    <div className="flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 p-1.5 shadow-inner">
                        <button
                            onClick={() => {
                                setView('signin');
                                setShowEmailForm(false);
                                setError(null);
                            }}
                            className={cn(
                                "px-7 py-3 text-base font-medium transition-all duration-300 rounded-full",
                                view === 'signin'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg"
                                    : "bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => {
                                setView('signup');
                                setShowEmailForm(false);
                                setError(null);
                            }}
                            className={cn(
                                "px-7 py-3 text-base font-medium transition-all duration-300 rounded-full",
                                view === 'signup'
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg"
                                    : "bg-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            Sign Up
                        </button>
                    </div>
                </motion.div>

                <div className="px-4 pb-8">
                    <AnimatePresence mode="wait">
                        {!showEmailForm ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col gap-5"
                            >
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                                    {view === 'signin' ? 'Welcome Back' : 'Create Your Account'}
                                </h2>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl border border-red-100 dark:border-red-800 flex items-start"
                                    >
                                        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                <button
                                    onClick={handleGoogleSignIn}
                                    className="flex items-center justify-center w-full py-3.5 px-4 border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300 shadow-sm"
                                >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        <path fill="none" d="M1 1h22v22H1z" />
                                    </svg>
                                    <span className="text-gray-800 dark:text-white font-medium">
                                        {view === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
                                    </span>
                                </button>

                                <div className="relative flex items-center my-5">
                                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                    <span className="flex-shrink-0 mx-4 text-gray-500 dark:text-gray-400 text-sm">or</span>
                                    <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                                </div>

                                <button
                                    onClick={() => setShowEmailForm(true)}
                                    className="w-full py-3.5 px-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-md hover:shadow-lg"
                                >
                                    {view === 'signin' ? 'Sign in with Email' : 'Sign up with Email'}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.form
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                                onSubmit={handleSubmit}
                                className="bg-white dark:bg-gray-900 rounded-2xl"
                            >
                                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                                    {view === 'signin' ? 'Sign In with Email' : 'Sign Up with Email'}
                                </h2>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-5 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-xl border border-red-100 dark:border-red-800 flex items-start"
                                    >
                                        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}

                                {view === 'signup' && (
                                    <>
                                        <div className="mb-5">
                                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1 flex items-center">
                                                <User className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
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
                                                        "w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all",
                                                        touched.fullName && !fullName.trim() && "border-red-300 dark:border-red-700 focus:ring-red-500"
                                                    )}
                                                    placeholder="Your full name"
                                                    required
                                                />
                                                {touched.fullName && fullName.trim() && (
                                                    <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-5">
                                            <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1 flex items-center">
                                                <UserCog className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                                                I am a...
                                            </label>
                                            <div className="relative">
                                                <select
                                                    id="userType"
                                                    value={userType}
                                                    onChange={(e) => setUserType(e.target.value)}
                                                    className="w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236B7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat"
                                                    required
                                                >
                                                    {USER_TYPES.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                <CheckCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="mb-5">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1 flex items-center">
                                        <Mail className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
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
                                                "w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all",
                                                touched.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && "border-red-300 dark:border-red-700 focus:ring-red-500"
                                            )}
                                            placeholder="your.email@example.com"
                                            required
                                        />
                                        {touched.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                                            <CheckCircle className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1 flex items-center">
                                        <Lock className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
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
                                                "w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all pr-24",
                                                touched.password && password.length < 6 && "border-red-300 dark:border-red-700 focus:ring-red-500"
                                            )}
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                        <div className="absolute inset-y-0 right-0 flex items-center">
                                            {view === 'signup' && (
                                                <button
                                                    type="button"
                                                    onClick={generatePassword}
                                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                                    title="Generate secure password"
                                                >
                                                    <RefreshCw className="h-5 w-5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                            >
                                                {showPassword ?
                                                    <EyeOff className="h-5 w-5" /> :
                                                    <Eye className="h-5 w-5" />
                                                }
                                            </button>
                                        </div>
                                        {touched.password && password.length >= 6 && (
                                            <CheckCircle className="absolute right-20 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                        )}
                                    </div>
                                    {view === 'signup' && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-1">
                                            Password must be at least 6 characters long
                                        </p>
                                    )}
                                </div>

                                {view === 'signup' && (
                                    <div className="mb-6">
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1 flex items-center">
                                            <Lock className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
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
                                                    "w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all pr-12",
                                                    touched.confirmPassword && password !== confirmPassword && "border-red-300 dark:border-red-700 focus:ring-red-500"
                                                )}
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                            >
                                                {showConfirmPassword ?
                                                    <EyeOff className="h-5 w-5" /> :
                                                    <Eye className="h-5 w-5" />
                                                }
                                            </button>
                                            {touched.confirmPassword && password === confirmPassword && password.length >= 6 && (
                                                <CheckCircle className="absolute right-12 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col space-y-4 mt-8">
                                    <button
                                        type="submit"
                                        disabled={loading || (view === 'signup' && password !== confirmPassword)}
                                        className="w-full py-3.5 px-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-blue-400"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                {view === 'signin' ? 'Signing in...' : 'Creating account...'}
                                            </span>
                                        ) : view === 'signin' ? ('Sign In') : ('Create Account')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowEmailForm(false)}
                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-center py-2 font-medium transition-colors"
                                    >
                                        Back to options
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
