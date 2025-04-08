import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useState } from 'react';
import { fullVersion } from '../utils/version';
const BuildInfoBanner = () => {
    console.log('[BuildInfoBanner] Rendering with version:', fullVersion);
    const [isVisible, setIsVisible] = useState(true);
    useEffect(() => {
        console.log('[BuildInfoBanner] Component mounted');
        // Force visibility by logging to DOM
        document.title = `Version: ${fullVersion}`;
    }, []);
    if (!isVisible)
        return null;
    return (_jsxs("div", { className: "bg-red-600 text-white text-xs text-center py-1 px-2 fixed top-0 left-0 right-0 shadow-md", style: {
            height: '22px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 999999,
            fontWeight: 'bold'
        }, children: [_jsxs("span", { style: { flexGrow: 1 }, children: ["Version: ", fullVersion || 'Loading...'] }), _jsx("button", { onClick: () => setIsVisible(false), className: "text-white hover:text-gray-300 flex-shrink-0", "aria-label": "Close banner", style: { marginLeft: '8px', fontSize: '14px' }, children: "\u00D7" })] }));
};
export default BuildInfoBanner;
