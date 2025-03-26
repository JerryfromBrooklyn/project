import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
console.log('MainLayout is being imported');
const MainLayout = ({ children }) => {
    console.log('MainLayout is rendering');
    console.log('Children passed to MainLayout:', children ? 'exists' : 'none');
    return (_jsx("div", { className: "min-h-screen bg-gray-50 dark:bg-gray-900", children: _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "container mx-auto px-4 py-8", children: _jsx("main", { className: "rounded-lg bg-white dark:bg-gray-800 shadow-lg p-6", children: children }) }) }));
};
export default MainLayout;
