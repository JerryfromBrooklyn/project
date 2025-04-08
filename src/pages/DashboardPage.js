import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import Layout from '../components/layout/Layout';
import PhotoUploader from '../features/photos/components/PhotoUploader';
import PhotoGrid from '../features/photos/components/PhotoGrid';
import { Link } from 'react-router-dom';
/**
 * Dashboard page component
 */
const DashboardPage = () => {
    const { user } = useAuth();
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs("header", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "Dashboard" }), _jsx("div", { children: _jsx(Link, { to: "/photos", className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700", children: "View All Photos" }) })] }), _jsx("section", { children: _jsxs("div", { className: "bg-white border border-gray-200 rounded-xl p-6 shadow-sm", children: [_jsxs("h2", { className: "text-lg font-semibold mb-4", children: ["Welcome, ", user?.email] }), _jsx("p", { className: "text-gray-600 mb-4", children: "This is your dashboard where you can upload and manage your photos." }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg text-blue-800 text-sm", children: [_jsx("p", { className: "font-medium", children: "Face Detection Enabled" }), _jsx("p", { className: "mt-1", children: "When you upload photos, we'll automatically detect faces and add them to your database. This allows you to search and match people across events." })] })] }) }), _jsxs("section", { children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Upload New Photo" }), _jsx(PhotoUploader, {})] }), _jsxs("section", { children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h2", { className: "text-xl font-semibold", children: "Recent Photos" }), _jsx(Link, { to: "/photos", className: "text-blue-600 hover:underline text-sm", children: "View all photos" })] }), _jsx(PhotoGrid, {})] }), _jsx("section", { children: _jsx("details", { className: "bg-gray-50 p-4 rounded-lg border border-gray-200", children: _jsx("summary", { className: "font-semibold text-gray-700 cursor-pointer", children: "Debug Info - Locally Stored Photos" }) }) })] }) }));
};
export default DashboardPage;
