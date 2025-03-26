import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_VERSION } from '../config/version';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from './ui/tooltip';
export const VersionDisplay = () => {
    return (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-apple-blue-50 rounded-full text-sm font-medium text-apple-blue-700 hover:bg-apple-blue-100 transition-colors cursor-help border border-apple-blue-200", children: [_jsx(Info, { className: "w-4 h-4" }), _jsx("span", { className: "font-semibold", children: APP_VERSION.getVersionString() })] }) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Current application version" }) })] }) }));
};
