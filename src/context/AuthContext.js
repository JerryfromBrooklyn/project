import { jsx as _jsx } from "react/jsx-runtime";
// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    useEffect(() => {
        // Check for active session on mount
        const checkUser = async () => {
            try {
                const { data } = await supabase.auth.getSession();
                const currentUser = data.session?.user || null;
                setUser(currentUser);
                setLoading(false);
                if (currentUser) {
                    navigate('/dashboard');
                }
                // Set up listener for auth changes
                const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
                    const currentUser = session?.user || null;
                    setUser(currentUser);
                    if (currentUser) {
                        navigate('/dashboard');
                    }
                });
                return () => {
                    authListener.subscription.unsubscribe();
                };
            }
            catch (error) {
                console.error('Error checking auth state:', error);
                setLoading(false);
            }
        };
        checkUser();
    }, [navigate]);
    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (!error && data.user) {
                navigate('/dashboard');
            }
            return { data: data.user, error };
        }
        catch (error) {
            return { data: null, error: error };
        }
    };
    const signInWithGoogle = async () => {
        // Get the current domain from window.location
        const domain = window.location.origin;
        // Check if we're on localhost
        const redirectTo = domain.includes('localhost')
            ? 'https://eclectic-pasca-5d5fbb.netlify.app/dashboard' // Use Netlify URL for localhost
            : `${domain}/dashboard`; // Use current domain for production
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                }
            }
        });
    };
    const signUp = async (email, password, fullName, userType) => {
        try {
            console.log('Starting signup process...');
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        user_type: userType,
                    },
                },
            });
            if (error) {
                console.error('Signup error:', error);
                return { data: null, error };
            }
            if (!data.user) {
                console.error('No user data returned from signup');
                return { data: null, error: new Error('No user data returned') };
            }
            console.log('User created successfully:', data.user.id);
            // Create profile entry
            const { error: profileError } = await supabase.from('users').insert({
                id: data.user.id,
                email: email,
                full_name: fullName,
                role: userType,
            });
            if (profileError) {
                console.error('Error creating user profile:', profileError);
                // Delete the auth user if profile creation fails
                await supabase.auth.admin.deleteUser(data.user.id);
                return { data: null, error: profileError };
            }
            console.log('User profile created successfully');
            navigate('/dashboard');
            return { data: data.user, error: null };
        }
        catch (error) {
            console.error('Unexpected error during signup:', error);
            return { data: null, error: error };
        }
    };
    const signOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };
    return (_jsx(AuthContext.Provider, { value: { user, loading, signIn, signInWithGoogle, signUp, signOut }, children: children }));
}
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
