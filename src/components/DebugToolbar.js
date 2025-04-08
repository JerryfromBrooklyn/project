import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { inspectDynamoItem, testFaceAttributesStorage, fixAllFaceAttributes } from '../debug-utils';
import { verifyAndFixUrls } from '../utils/s3UrlFixer';
/**
 * Hidden debug toolbar that can be activated with Ctrl+Shift+D
 * Provides direct access to face data repair utilities
 */
const DebugToolbar = () => {
    const [visible, setVisible] = useState(false);
    const [isRepairing, setIsRepairing] = useState(false);
    const [isFixingUrls, setIsFixingUrls] = useState(false);
    const [result, setResult] = useState(null);
    const { user } = useAuth();
    // Handle keyboard shortcut to show/hide the toolbar
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+Shift+D
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                setVisible(prevVisible => !prevVisible);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    if (!visible)
        return null;
    // Run repair for the current user
    const handleRepairFaces = async () => {
        if (!user?.id) {
            setResult({
                success: false,
                error: 'No user logged in'
            });
            return;
        }
        setIsRepairing(true);
        setResult(null);
        try {
            console.log(`[DEBUG-TOOLBAR] 🔧 Starting face data repair for user ${user.id}`);
            const repairResult = await fixAllFaceAttributes(user.id);
            setResult(repairResult);
            if (repairResult.success) {
                console.log(`[DEBUG-TOOLBAR] ✅ Face data repair completed successfully`);
                // Force reload to show the changes
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
            else {
                console.error(`[DEBUG-TOOLBAR] ❌ Face data repair failed:`, repairResult.error);
            }
        }
        catch (error) {
            console.error(`[DEBUG-TOOLBAR] ❌ Face data repair error:`, error);
            setResult({
                success: false,
                error: error.message
            });
        }
        finally {
            setIsRepairing(false);
        }
    };
    // Fix S3 URLs for the current user
    const handleFixS3Urls = async () => {
        if (!user?.id) {
            setResult({
                success: false,
                error: 'No user logged in'
            });
            return;
        }
        setIsFixingUrls(true);
        setResult(null);
        try {
            console.log(`[DEBUG-TOOLBAR] 🔧 Starting S3 URL fix for user ${user.id}`);
            // Always use the current user ID - never fix all users' photos
            const fixResult = await verifyAndFixUrls(user.id);
            setResult({
                success: true,
                type: 'url-fix',
                ...fixResult
            });
            console.log(`[DEBUG-TOOLBAR] ✅ S3 URL fix completed:`, fixResult);
            if (fixResult.fixed > 0) {
                // Force reload to show the changes
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            }
        }
        catch (error) {
            console.error(`[DEBUG-TOOLBAR] ❌ S3 URL fix error:`, error);
            setResult({
                success: false,
                type: 'url-fix',
                error: error.message
            });
        }
        finally {
            setIsFixingUrls(false);
        }
    };
    return (_jsxs("div", { className: "fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-4 z-50 shadow-lg", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h2", { className: "text-xl font-bold", children: "Debug Toolbar" }), _jsx("button", { onClick: () => setVisible(false), className: "text-gray-400 hover:text-white", children: "Close" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "bg-gray-700 p-3 rounded-lg", children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "Face Data Repair" }), _jsx("div", { className: "mb-2", children: _jsxs("p", { className: "text-sm text-gray-300", children: ["User ID: ", user?.id || 'Not logged in'] }) }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-2", children: [_jsx("button", { onClick: handleRepairFaces, disabled: isRepairing || !user?.id, className: `px-4 py-2 rounded-md ${isRepairing
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'} text-white font-medium`, children: isRepairing ? 'Repairing...' : 'Repair Face Attributes' }), _jsx("button", { onClick: handleFixS3Urls, disabled: isFixingUrls || !user?.id, className: `px-4 py-2 rounded-md ${isFixingUrls || !user?.id
                                            ? 'bg-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium`, children: isFixingUrls ? 'Fixing...' : 'Fix My Face Image' })] })] }), _jsxs("div", { className: "bg-gray-700 p-3 rounded-lg", children: [_jsx("h3", { className: "text-lg font-medium mb-2", children: "Result" }), result ? (_jsxs("div", { className: `text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`, children: [_jsx("p", { className: "font-medium", children: result.success
                                            ? 'Operation successful!'
                                            : `Error: ${result.error || 'Unknown error'}` }), result.success && result.type === 'url-fix' && (_jsxs("div", { className: "mt-2", children: [_jsxs("p", { children: ["Total Records: ", result.total] }), _jsxs("p", { children: ["Checked: ", result.checked] }), _jsxs("p", { children: ["Fixed: ", result.fixed] }), _jsxs("p", { children: ["Already Correct: ", result.alreadyCorrect] }), _jsxs("p", { children: ["Errors: ", result.errors] })] })), result.success && result.results && (_jsxs("div", { className: "mt-2", children: [_jsxs("p", { children: ["Total Faces: ", result.results.length] }), _jsxs("p", { children: ["Fixed: ", result.results.filter(r => r.status === 'fixed').length] }), _jsxs("p", { children: ["Skipped: ", result.results.filter(r => r.status === 'skipped').length] }), _jsxs("p", { children: ["Errors: ", result.results.filter(r => r.status === 'error').length] })] }))] })) : (_jsx("p", { className: "text-sm text-gray-400", children: "Run an operation to see results" }))] })] }), _jsx("div", { className: "mt-4 text-xs text-gray-400", children: _jsx("p", { children: "Press Ctrl+Shift+D to toggle this toolbar" }) })] }));
};
export default DebugToolbar;
