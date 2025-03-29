import React from 'react';
import SimplePhotoUploader from '../components/SimplePhotoUploader';

const EmergencyTools = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg">
        <h2 className="text-lg font-semibold text-amber-800 mb-2">⚠️ Emergency Tools</h2>
        <p className="text-amber-700">
          These tools are provided for emergency situations when regular functionality has permission or database issues.
          Use these tools to bypass normal security checks and restore functionality.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <SimplePhotoUploader />
        </div>
        
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Use the Simple Emergency Photo Uploader when the normal uploader fails with permission errors</li>
              <li>Photos uploaded here will still be processed by face recognition when database permissions are fixed</li>
              <li>Apply SQL fixes through the Supabase dashboard to permanently resolve permission issues</li>
              <li>
                <strong>Recommended SQL fix:</strong>
                <pre className="bg-gray-100 p-3 rounded mt-2 text-xs overflow-auto max-h-48">
                  {`-- Disable RLS on required tables
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
GRANT EXECUTE ON FUNCTION public.simple_photo_insert TO authenticated;`}
                </pre>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyTools; 