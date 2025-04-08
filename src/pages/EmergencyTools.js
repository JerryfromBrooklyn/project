import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import SimplePhotoUploader from '../components/SimplePhotoUploader';
const EmergencyTools = () => {
    return (_jsxs("div", { className: "p-6 max-w-6xl mx-auto", children: [_jsxs("div", { className: "bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg", children: [_jsx("h2", { className: "text-lg font-semibold text-amber-800 mb-2", children: "\u26A0\uFE0F Emergency Tools" }), _jsx("p", { className: "text-amber-700", children: "These tools are provided for emergency situations when regular functionality has permission or database issues. Use these tools to bypass normal security checks and restore functionality." })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsx("div", { className: "col-span-1", children: _jsx(SimplePhotoUploader, {}) }), _jsx("div", { className: "col-span-1", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-md", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Instructions" }), _jsxs("ol", { className: "list-decimal pl-6 space-y-2", children: [_jsx("li", { children: "Use the Simple Emergency Photo Uploader when the normal uploader fails with permission errors" }), _jsx("li", { children: "Photos uploaded here will still be processed by face recognition when database permissions are fixed" }), _jsx("li", { children: "Apply SQL fixes through the Supabase dashboard to permanently resolve permission issues" }), _jsxs("li", { children: [_jsx("strong", { children: "Recommended SQL fix:" }), _jsx("pre", { className: "bg-gray-100 p-3 rounded mt-2 text-xs overflow-auto max-h-48", children: `-- Disable RLS on required tables
ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Create simple photo insert function
CREATE OR REPLACE FUNCTION public.simple_photo_insert(
    p_id UUID,
    p_user_id UUID,
    p_storage_path TEXT,
    p_public_url TEXT,
    p_file_size BIGINT DEFAULT 0,
    p_file_type TEXT DEFAULT 'image/jpeg'
)
RETURNS UUID 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.photos (
        id, uploaded_by, storage_path, public_url,
        file_size, file_type, created_at
    ) VALUES (
        p_id, p_user_id, p_storage_path, p_public_url,
        p_file_size, p_file_type, now()
    )
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO authenticated;` })] })] })] }) })] })] }));
};
export default EmergencyTools;
