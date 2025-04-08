import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Header from './Header';
/**
 * Main layout component that wraps all pages
 */
const Layout = ({ children }) => {
    return (_jsxs("div", { className: "min-h-screen flex flex-col bg-gray-50", children: [_jsx(Header, {}), _jsx("main", { className: "flex-grow py-8", children: _jsx("div", { className: "container mx-auto px-4 max-w-4xl", children: children }) }), _jsx("footer", { className: "bg-white border-t border-gray-200 py-6", children: _jsxs("div", { className: "container mx-auto px-4 text-center text-gray-500 text-sm", children: [_jsxs("p", { children: ["\u00A9 ", new Date().getFullYear(), " Photo App. All rights reserved."] }), _jsx("p", { className: "mt-1", children: "Built with Supabase, React, and AWS Rekognition" })] }) })] }));
};
export default Layout;
