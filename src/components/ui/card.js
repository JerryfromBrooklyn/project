import { jsx as _jsx } from "react/jsx-runtime";
export const Card = ({ className = '', children }) => {
    return (_jsx("div", { className: `bg-white rounded-lg shadow-md overflow-hidden ${className}`, children: children }));
};
export const CardContent = ({ className = '', children }) => {
    return (_jsx("div", { className: `p-4 ${className}`, children: children }));
};
export default { Card, CardContent };
