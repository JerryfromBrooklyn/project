import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const SimplePhotoUpload = ({ onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const uploadPhoto = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setMessage('Uploading file...');
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // Create a unique file name
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `simple-uploads/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, selectedFile);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);
      
      // Insert record directly into simple_photos
      const { data: photoData, error: insertError } = await supabase
        .from('simple_photos')
        .insert({
          uploaded_by: user.id,
          public_url: publicUrl
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      setMessage('Upload successful! Photo ID: ' + photoData.id);
      setSelectedFile(null);
      
      // Call the onSuccess callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Error uploading photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Simple Photo Upload</h2>
      <p className="mb-2 text-gray-600">This component bypasses the problematic database functions</p>
      
      <div className="mb-4">
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
        />
      </div>
      
      <button 
        onClick={uploadPhoto} 
        disabled={uploading || !selectedFile}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Upload Photo'}
      </button>
      
      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
};

export default SimplePhotoUpload; 