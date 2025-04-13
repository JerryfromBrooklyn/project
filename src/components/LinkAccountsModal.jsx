import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Loader2, UserPlus, RefreshCw } from 'lucide-react';
import LinkedAccountsService from '../services/LinkedAccountsService';
const LinkAccountsModal = ({ isOpen, onClose, supabase, user }) => {
    const [linkCode, setLinkCode] = useState('');
    const [linkedAccounts, setLinkedAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [myLinkCode, setMyLinkCode] = useState('');
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
    // Fetch linked accounts on load
    useEffect(() => {
        if (isOpen && user) {
            fetchLinkedAccounts();
        }
    }, [isOpen, user]);
    // Fetch linked accounts
    const fetchLinkedAccounts = async () => {
        if (!user)
            return;
        setIsLoadingAccounts(true);
        try {
            // Use the LinkedAccountsService to get accounts
            const accounts = await LinkedAccountsService.getLinkedUserIds(user.id);
            if (!accounts || accounts.length <= 1) {
                // Only has own account
                setLinkedAccounts([]);
                setIsLoadingAccounts(false);
                return;
            }
            // Get full details for each account
            const accountDetails = [];
            for (const accountId of accounts) {
                if (accountId === user.id)
                    continue; // Skip current user
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('id, email, full_name, avatar_url')
                    .eq('id', accountId)
                    .single();
                if (!userError && userData) {
                    accountDetails.push(userData);
                }
            }
            setLinkedAccounts(accountDetails);
        }
        catch (err) {
            console.error('Exception fetching linked accounts:', err);
            setError('An unexpected error occurred');
        }
        finally {
            setIsLoadingAccounts(false);
        }
    };
    // Generate a temporary code for linking accounts
    const generateLinkCode = async () => {
        setIsGeneratingCode(true);
        setError('');
        setSuccess('');
        try {
            // Store the code in localStorage with the user ID
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();
            localStorage.setItem('account_link_code', code);
            localStorage.setItem('account_link_user_id', user.id);
            localStorage.setItem('account_link_timestamp', Date.now().toString());
            setMyLinkCode(code);
        }
        catch (err) {
            console.error('Error generating link code:', err);
            setError('Failed to generate link code');
        }
        finally {
            setIsGeneratingCode(false);
        }
    };
    // Link account using code
    const linkAccount = async () => {
        if (!linkCode.trim()) {
            setError('Please enter a link code');
            return;
        }
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            // Get the user ID associated with the entered code
            const storedCode = localStorage.getItem('account_link_code');
            const storedUserId = localStorage.getItem('account_link_user_id');
            const timestamp = parseInt(localStorage.getItem('account_link_timestamp') || '0');
            // Check if code is expired (10 minutes)
            const isExpired = Date.now() - timestamp > 10 * 60 * 1000;
            if (!storedCode || !storedUserId || isExpired) {
                setError('Invalid or expired link code');
                setIsLoading(false);
                return;
            }
            if (storedCode !== linkCode.trim().toUpperCase()) {
                setError('Invalid link code');
                setIsLoading(false);
                return;
            }
            if (storedUserId === user.id) {
                setError('Cannot link to your own account');
                setIsLoading(false);
                return;
            }
            // Link the accounts in the database using the service
            const result = await LinkedAccountsService.linkUserAccounts(user.id, storedUserId);
            if (!result.success) {
                console.error('Error linking accounts:', result.error);
                setError(result.error || 'Failed to link accounts');
            }
            else {
                setSuccess('Accounts linked successfully!');
                setLinkCode('');
                fetchLinkedAccounts();
            }
        }
        catch (err) {
            console.error('Exception linking accounts:', err);
            setError('An unexpected error occurred');
        }
        finally {
            setIsLoading(false);
        }
    };
    // Unlink account
    const unlinkAccount = async (accountId) => {
        if (!confirm('Are you sure you want to unlink this account?')) {
            return;
        }
        try {
            const result = await LinkedAccountsService.unlinkUserAccount(accountId);
            if (!result.success) {
                console.error('Error unlinking account:', result.error);
                setError(result.error || 'Failed to unlink account');
            }
            else {
                setSuccess('Account unlinked successfully');
                fetchLinkedAccounts();
            }
        }
        catch (err) {
            console.error('Exception unlinking account:', err);
            setError('An unexpected error occurred');
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex justify-between items-center p-4 border-b", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Link Accounts" }), _jsx("button", { onClick: onClose, className: "p-1 rounded-full hover:bg-gray-100", children: _jsx(X, { size: 20 }) })] }), _jsxs("div", { className: "p-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Link multiple accounts to see your photos across all of them. Photos that match your face in any linked account will appear in your gallery." }), error && (_jsx("div", { className: "bg-red-50 text-red-700 p-3 rounded-md mb-4", children: error })), success && (_jsx("div", { className: "bg-green-50 text-green-700 p-3 rounded-md mb-4", children: success })), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "font-medium mb-2", children: "Your Link Code" }), _jsxs("div", { className: "flex gap-2", children: [myLinkCode ? (_jsx("div", { className: "flex-1 bg-blue-50 p-3 rounded-md font-mono text-center text-xl", children: myLinkCode })) : (_jsx("div", { className: "flex-1 bg-gray-50 p-3 rounded-md text-gray-500 text-center", children: "No active code" })), _jsxs("button", { onClick: generateLinkCode, disabled: isGeneratingCode, className: "px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center", children: [isGeneratingCode ? (_jsx(Loader2, { size: 16, className: "animate-spin mr-1" })) : (_jsx(RefreshCw, { size: 16, className: "mr-1" })), "Generate"] })] }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Share this code with your other account to link them together" })] }), _jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "font-medium mb-2", children: "Link Using Code" }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", placeholder: "Enter link code", value: linkCode, onChange: (e) => setLinkCode(e.target.value), className: "flex-1 p-2 border rounded-md", maxLength: 6 }), _jsxs("button", { onClick: linkAccount, disabled: isLoading || !linkCode.trim(), className: "px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-green-300 flex items-center", children: [isLoading ? (_jsx(Loader2, { size: 16, className: "animate-spin mr-1" })) : (_jsx(Check, { size: 16, className: "mr-1" })), "Link"] })] })] }), _jsxs("div", { children: [_jsxs("h3", { className: "font-medium mb-2 flex items-center", children: ["Linked Accounts", isLoadingAccounts && (_jsx(Loader2, { size: 16, className: "animate-spin ml-2" }))] }), linkedAccounts.length === 0 ? (_jsxs("div", { className: "text-center py-6 bg-gray-50 rounded-md", children: [_jsx(UserPlus, { size: 24, className: "mx-auto text-gray-400 mb-2" }), _jsx("p", { className: "text-gray-500", children: "No linked accounts yet" })] })) : (_jsx("ul", { className: "space-y-2", children: linkedAccounts.map((account) => (_jsxs("li", { className: "flex items-center justify-between bg-gray-50 p-3 rounded-md", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium", children: account.full_name || account.email }), _jsx("div", { className: "text-sm text-gray-500", children: account.email })] }), _jsx("button", { onClick: () => unlinkAccount(account.id), className: "p-1 text-red-500 hover:bg-red-50 rounded", title: "Unlink account", children: _jsx(Trash2, { size: 16 }) })] }, account.id))) }))] })] }), _jsx("div", { className: "p-4 border-t flex justify-end", children: _jsx("button", { onClick: onClose, className: "px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300", children: "Close" }) })] }) }));
};
export default LinkAccountsModal;
