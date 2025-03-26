import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Camera, Search, User } from 'lucide-react';
console.log('Navigation is being imported');
const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/upload', label: 'Upload', icon: Camera },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/profile', label: 'Profile', icon: User },
];
const Navigation = () => {
    console.log('Navigation is rendering');
    const location = useLocation();
    console.log('Current location pathname:', location.pathname);
    return (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "flex justify-around items-center h-16", children: navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (_jsxs(Link, { to: item.path, className: "flex flex-col items-center justify-center w-full h-full relative", children: [_jsx(motion.div, { whileHover: { scale: 1.1 }, whileTap: { scale: 0.95 }, className: `p-2 rounded-full ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'}`, children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsx("span", { className: `text-xs mt-1 ${isActive
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-gray-600 dark:text-gray-400'}`, children: item.label }), isActive && (_jsx(motion.div, { layoutId: "activeTab", className: "absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400", initial: false }))] }, item.path));
                }) }) }) }));
};
export default Navigation;
