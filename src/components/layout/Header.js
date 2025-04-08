import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { fullVersion } from '../../utils/version';
/**
 * Header component with navigation and user actions
 */
const Header = () => {
    const { user, signOut } = useAuth();
    return (_jsx("header", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "container mx-auto px-4 py-3 flex justify-between items-center", children: [_jsxs("div", { className: "flex flex-col", children: [_jsx(Link, { to: "/", className: "text-xl font-bold text-blue-600", children: "Photo App" }), _jsxs("span", { className: "text-xs text-gray-500 mt-1", children: ["v", fullVersion] })] }), _jsxs("nav", { className: "hidden md:flex space-x-4", children: [_jsx(Link, { to: "/", className: "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md", children: "Home" }), user && (_jsxs(_Fragment, { children: [_jsx(Link, { to: "/dashboard", className: "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md", children: "Dashboard" }), _jsx(Link, { to: "/photos", className: "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md", children: "Photos" })] })), _jsx(Link, { to: "/about", className: "text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md", children: "About" })] }), _jsx("div", { className: "flex items-center space-x-4", children: user ? (_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("div", { className: "text-sm text-gray-700", children: user.email }), _jsx("button", { onClick: signOut, className: "px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200", children: "Logout" })] })) : (_jsxs("div", { className: "flex space-x-2", children: [_jsx(Link, { to: "/login", className: "px-4 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50", children: "Login" }), _jsx(Link, { to: "/signup", className: "px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700", children: "Sign Up" })] })) })] }) }));
};
export default Header;
