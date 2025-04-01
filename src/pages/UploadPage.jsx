import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import SimplePhotoUploader from '../components/SimplePhotoUploader';
import { useAuth } from '../auth/hooks/useAuth';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Image, Upload, AlertCircle } from 'lucide-react';

/**
 * Upload page component with face recognition
 * Features the enhanced photo uploader with extensive logging
 */
const UploadPage = () => {
  const { user } = useAuth();
  const [recentUploads, setRecentUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent uploads by the current user
  useEffect(() => {
    const fetchRecentUploads = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false })
          .limit(4); // Reduced to just show a few recent items
          
        if (error) throw error;
        setRecentUploads(data || []);
      } catch (err) {
        console.error('Error fetching recent uploads:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentUploads();
  }, [user]);

  return (
    <Layout>
      <div className="space-y-8">
        <header className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">FACE RECOGNITION UPLOAD</h1>
          <p className="text-gray-600 mt-2">
            Upload photos to automatically detect and match faces using AWS Rekognition
          </p>
        </header>

        {/* Feature highlight banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-md">
          <div className="flex items-start">
            <div className="bg-white/20 p-2 rounded-lg mr-4">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Enhanced Face Recognition Upload</h2>
              <p className="mt-1 text-blue-100">
                This uploader features real-time face detection, AWS Rekognition integration, 
                and detailed logging of the entire process
              </p>
            </div>
          </div>
        </div>

        {/* Primary content: SimplePhotoUploader */}
        <section className="bg-white rounded-xl shadow-md overflow-hidden">
          <SimplePhotoUploader />
        </section>

        {/* Secondary content: Recent uploads */}
        <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Image className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Recent Uploads</h2>
            </div>
            <Link 
              to="/photos" 
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all photos →
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : recentUploads.length === 0 ? (
            <div className="bg-white p-6 text-center rounded-lg border border-gray-100">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">You haven't uploaded any photos yet</p>
              <p className="text-sm text-gray-400 mt-1">Your recent uploads will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recentUploads.map(photo => (
                <div key={photo.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-gray-100 relative">
                    {photo.public_url ? (
                      <img 
                        src={photo.public_url} 
                        alt={`Photo ${photo.id}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300?text=Error';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Image className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-500">
                      {new Date(photo.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default UploadPage; 