import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import SimplePhotoUpload from './components/workaround/SimplePhotoUpload';
import AdminTools from './components/AdminTools';

const SimpleApp = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        fetchPhotos();
      }
    });

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session) {
          fetchPhotos();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const { data, error } = await supabase
        .from('simple_photos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'jerry@jerry.com',
      password: '!Jerrydec051488'
    });

    if (error) {
      console.error('Error logging in:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPhotos([]);
  };

  const refreshPhotos = () => {
    fetchPhotos();
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Photo Upload Workaround</h1>
        <button 
          onClick={handleLogin}
          className="w-full p-2 bg-blue-600 text-white rounded-lg"
        >
          Login with Test User
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Photo Upload Workaround</h1>
        <div className="flex gap-2">
          <button 
            onClick={refreshPhotos} 
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            Refresh
          </button>
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mb-8">
        <AdminTools />
      </div>

      <div className="mb-8">
        <SimplePhotoUpload onSuccess={refreshPhotos} />
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Your Photos</h2>
        {loadingPhotos ? (
          <div className="text-center p-4">Loading photos...</div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className="border rounded-lg overflow-hidden">
                <img 
                  src={photo.public_url} 
                  alt="User uploaded"
                  className="w-full h-48 object-cover"
                />
                <div className="p-2">
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(photo.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            No photos uploaded yet
          </div>
        )}
      </div>

      <div className="bg-yellow-100 p-4 rounded-lg">
        <h3 className="font-bold">Instructions for fixing database</h3>
        <p className="mb-2">To fix the database issue with 'column u.full_name does not exist', run the following SQL in the Supabase dashboard:</p>
        <pre className="p-2 bg-gray-800 text-white rounded overflow-x-auto text-xs mb-2">
          {`-- Fix the update_matched_users function
CREATE OR REPLACE FUNCTION update_matched_users() 
RETURNS trigger AS $$
BEGIN
  -- Get user details for each face match - without using u.full_name
  WITH matched_details AS (
    SELECT DISTINCT 
      u.id,
      u.email as display_name, -- Use email instead of full_name
      NULL as avatar_url,
      (f->>'confidence')::float as confidence
    FROM 
      jsonb_array_elements(NEW.faces) AS f,
      auth.users u
    WHERE 
      u.id = (f->>'userId')::uuid
  )
  -- Update matched_users with user details
  UPDATE public.photos 
  SET matched_users = (
    SELECT jsonb_agg(
      jsonb_build_object(
        'userId', id,
        'fullName', display_name,
        'avatarUrl', avatar_url,
        'confidence', confidence
      )
    )
    FROM matched_details
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;`}
        </pre>
      </div>
    </div>
  );
};

export default SimpleApp; 