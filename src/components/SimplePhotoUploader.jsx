import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import './SimplePhotoUploader.css';

const SimplePhotoUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      setResult(null);
    }
  };

  const uploadPhoto = async () => {
    if (!file) {
      setMessage('Please select a file first');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setMessage('Starting upload...');

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage('Error: User not authenticated');
        setUploading(false);
        return;
      }

      // Generate a unique ID
      const photoId = uuidv4();
      
      // Create storage path
      const storagePath = `${user.id}/${photoId}-${file.name}`;
      
      setMessage('Uploading file to storage...');
      setUploadProgress(30);
      
      // Upload file to storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(storagePath, file, { upsert: true });
      
      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }
      
      setUploadProgress(50);
      setMessage('Getting public URL...');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(storagePath);
      
      setUploadProgress(70);
      setMessage('Creating database record...');
      
      // Minimal record to avoid permissions issues
      const minimalRecord = {
        id: photoId,
        uploaded_by: user.id,
        user_id: user.id,
        storage_path: storagePath,
        public_url: publicUrl,
        url: publicUrl,
        file_size: file.size,
        size: file.size,
        file_type: file.type,
        type: file.type,
        created_at: new Date().toISOString()
      };
      
      // Insert with minimal data
      const { data, error } = await supabase
        .from('photos')
        .insert(minimalRecord);
      
      if (error) {
        console.error('DB insert error:', error);
        setMessage(`Database insert failed. Trying alternative method...`);
        
        // Try RPC method as fallback
        try {
          const { error: rpcError } = await supabase.rpc(
            'simple_photo_insert',
            {
              p_id: photoId,
              p_user_id: user.id,
              p_storage_path: storagePath,
              p_public_url: publicUrl,
              p_file_size: file.size,
              p_file_type: file.type
            }
          );
          
          if (rpcError) {
            throw new Error(`RPC insert failed: ${rpcError.message}`);
          }
        } catch (rpcFailError) {
          console.error('RPC fallback failed:', rpcFailError);
          
          // Final fallback: just return the file info even if DB insert fails
          setMessage('Database record creation failed, but file was uploaded successfully');
          setResult({
            success: true,
            photoId,
            url: publicUrl,
            note: 'File uploaded but database record failed'
          });
          setUploading(false);
          setUploadProgress(100);
          return;
        }
      }
      
      setUploadProgress(100);
      setMessage('Upload completed successfully!');
      setResult({
        success: true,
        photoId,
        url: publicUrl
      });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error: ${error.message}`);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="simple-uploader">
      <h2>Simple Emergency Photo Uploader</h2>
      <p className="note">This is a simplified uploader that bypasses complex permissions</p>
      
      <div className="upload-container">
        <input 
          type="file" 
          onChange={handleFileChange}
          accept="image/*"
          disabled={uploading}
        />
        
        <button 
          onClick={uploadPhoto} 
          disabled={!file || uploading}
          className="upload-button"
        >
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
      
      {uploading && (
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <span>{uploadProgress}%</span>
        </div>
      )}
      
      {message && <p className="message">{message}</p>}
      
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          {result.success ? (
            <>
              <h3>Upload Successful!</h3>
              <p>Photo ID: {result.photoId}</p>
              <div className="image-preview">
                <img src={result.url} alt="Uploaded" />
              </div>
              <a href={result.url} target="_blank" rel="noopener noreferrer">
                View Full Size
              </a>
              {result.note && <p className="note">{result.note}</p>}
            </>
          ) : (
            <>
              <h3>Upload Failed</h3>
              <p>{result.error}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SimplePhotoUploader; 