import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';
import { PhotoService } from '../services/PhotoService';

// Helper function to get matches from localStorage
const getMatchesFromLocalStorage = (userId) => {
  try {
    const key = `face_matches_${userId}`;
    const matches = localStorage.getItem(key);
    if (!matches) return [];
    
    const parsedMatches = JSON.parse(matches);
    console.log(`[Storage] Retrieved ${parsedMatches.length} matches from localStorage`);
    return parsedMatches;
  } catch (err) {
    console.error('[Storage] Error retrieving matches from localStorage:', err);
    return [];
  }
};

// Simple URL construction with fallbacks
const getPhotoUrl = (photo) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  if (!photo) return null;
  
  // Try multiple paths to maximize chances of finding the image
  if (photo.path) {
    return `${supabaseUrl}/storage/v1/object/public/simple_photos/${photo.path}`;
  } else if (photo.storage_path) {
    return `${supabaseUrl}/storage/v1/object/public/photos/${photo.storage_path}`;
  } else if (photo.url) {
    return photo.url; // Direct URL if available 
  } else if (photo.public_url) {
    return photo.public_url; // Public URL if available
  } else {
    // Fallback to using ID directly
    return `${supabaseUrl}/storage/v1/object/public/simple_photos/${photo.id}`;
  }
};

export const PhotoManager = ({ mode = 'matches' }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to fetch photos once
  const fetchPhotos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`[Simple Fetch] Fetching photos for ${mode} mode`);
      const fetchedPhotos = [];
      
      // Try fetching from 'simple_photos' table
      const { data: simplePhotoData, error: simplePhotoError } = await supabase
        .from('simple_photos')
        .select('*')
        .limit(100);
      
      if (!simplePhotoError && simplePhotoData?.length > 0) {
        console.log(`[Simple Fetch] Found ${simplePhotoData.length} photos in simple_photos table`);
        fetchedPhotos.push(...simplePhotoData);
      } else if (simplePhotoError) {
        console.warn(`[Simple Fetch] Error fetching from simple_photos: ${simplePhotoError.message}`);
      }
      
      // Also try fetching from 'photos' table if available
      const { data: regularPhotoData, error: regularPhotoError } = await supabase
        .from('photos')
        .select('*')
        .limit(100);
      
      if (!regularPhotoError && regularPhotoData?.length > 0) {
        console.log(`[Simple Fetch] Found ${regularPhotoData.length} photos in regular photos table`);
        fetchedPhotos.push(...regularPhotoData);
      } else if (regularPhotoError) {
        console.warn(`[Simple Fetch] Error fetching from photos: ${regularPhotoError.message}`);
      }
      
      // For 'matches' mode, check localStorage
      if (mode === 'matches') {
        const localMatches = getMatchesFromLocalStorage(user.id);
        if (localMatches && localMatches.length > 0) {
          console.log(`[Simple Fetch] Found ${localMatches.length} matches in localStorage`);
          
          // If we have photo IDs from matches, use them as a filter
          const matchedPhotoIds = localMatches.map(match => match.photo_id);
          console.log(`[Simple Fetch] Matched photo IDs: ${matchedPhotoIds.slice(0, 5).join(', ')}...`);
          
          // If we have matches but no photos, let's create placeholder photos
          if (fetchedPhotos.length === 0) {
            console.log('[Simple Fetch] Creating placeholder photos from localStorage matches');
            
            // Create a placeholder photo object for each match
            const placeholderPhotos = matchedPhotoIds.map(id => ({
              id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              // We don't have real paths but the image component will try various fallbacks
              _source: 'localStorage_match',
              _debug: {
                fromMatch: true,
                matchId: id
              }
            }));
            
            console.log(`[Simple Fetch] Created ${placeholderPhotos.length} placeholder photos`);
            fetchedPhotos.push(...placeholderPhotos);
          }
        }
      }
      
      // If we have no photos at this point, log the issue
      if (fetchedPhotos.length === 0) {
        console.warn('[Simple Fetch] No photos found in any table');
      }
      
      // Remove duplicates by ID
      const uniquePhotos = Array.from(
        new Map(fetchedPhotos.map(photo => [photo.id, photo])).values()
      );
      
      console.log(`[Simple Fetch] Final unique photo count: ${uniquePhotos.length}`);
      
      // Add debugging information to each photo for rendering assistance
      const photosWithDebugInfo = uniquePhotos.map(photo => ({
        ...photo,
        _debug: {
          ...(photo._debug || {}),
          hasPath: !!photo.path,
          hasStoragePath: !!photo.storage_path,
          hasUrl: !!photo.url,
          hasPublicUrl: !!photo.public_url
        }
      }));
      
      // Log the first photo for debugging
      if (photosWithDebugInfo.length > 0) {
        console.log('[Simple Fetch] First photo example:', {
          id: photosWithDebugInfo[0].id,
          _debug: photosWithDebugInfo[0]._debug,
          // Don't log the entire object to keep logs clean
        });
      }
      
      setPhotos(photosWithDebugInfo);
    } catch (err) {
      console.error('[Simple Fetch] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Single effect to fetch photos when user or mode changes
  useEffect(() => {
    if (!user?.id) return;
    fetchPhotos();
  }, [user?.id, mode]);
  
  // Filter photos based on search term
  const filteredPhotos = searchTerm.trim() === '' 
    ? photos 
    : photos.filter(photo => 
        photo.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.path?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-md mb-6">
        <AlertCircle className="inline-block w-5 h-5 mr-2" />
        {error}
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Photos</h2>
        <div className="flex space-x-2">
          <button 
            onClick={fetchPhotos}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 py-2 border rounded-md"
          />
        </div>
      </div>
      
      <p className="text-blue-600 mb-6">
        Photos where you have been identified through facial recognition. 
        {photos.length > 0 && filteredPhotos.length !== photos.length && (
          <span className="ml-2 text-gray-600">
            Showing {filteredPhotos.length} of {photos.length} photos.
          </span>
        )}
      </p>
      
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-md">
          <p className="text-gray-500">
            {photos.length > 0 
              ? "No photos match your search" 
              : "No photos found"}
          </p>
        </div>
      ) : (
        <SimplePhotoGrid photos={filteredPhotos} onSelect={setSelectedPhoto} />
      )}
      
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
};

// Simple photo grid that just displays the images
const SimplePhotoGrid = ({ photos, onSelect }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative aspect-square bg-gray-100 rounded border border-gray-200 overflow-hidden cursor-pointer"
          onClick={() => onSelect?.(photo)}
        >
          {/* Photo ID for debugging */}
          <div className="absolute top-1 left-1 z-10 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
            {photo.id?.substring(0, 8)}
          </div>
          
          {/* Photo image - use multiple fallbacks */}
          <SimpleImage photo={photo} />
        </div>
      ))}
    </div>
  );
};

// Simple image component with fallbacks
const SimpleImage = ({ photo }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [url, setUrl] = useState(getPhotoUrl(photo));
  const [attemptCount, setAttemptCount] = useState(0);
  
  // Expanded list of fallback URLs to try if the primary one fails
  const fallbackUrls = [
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.id}`,
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/simple_photos/${photo.id}.jpg`,
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.id}.jpg`,
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.id}/original.jpg`,
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.id}.jpeg`,
    `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/simple_photos/${photo.id}.jpeg`,
    // Try with user_id prefix if available
    ...(photo.user_id ? [
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.user_id}/${photo.id}.jpg`,
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.user_id}/${photo.id}.jpeg`
    ] : []),
    // Try with uploaded_by prefix if available
    ...(photo.uploaded_by ? [
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.uploaded_by}/${photo.id}.jpg`,
      `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/photos/${photo.uploaded_by}/${photo.id}.jpeg`
    ] : [])
  ];
  
  // Function to try the next fallback URL
  const tryNextUrl = () => {
    if (fallbackUrls.length === 0) {
      console.log(`[SimpleImage] All URLs failed for photo ${photo.id}`);
      setError(true);
      return;
    }
    
    const nextUrl = fallbackUrls.shift();
    console.log(`[SimpleImage] Trying fallback URL for ${photo.id}: ${nextUrl}`);
    setUrl(nextUrl);
    setAttemptCount(prev => prev + 1);
  };
  
  // Debug output on initial render
  useEffect(() => {
    console.log(`[SimpleImage] Initial URL for photo ${photo.id}: ${url}`);
    console.log(`[SimpleImage] Photo data:`, photo);
  }, []);
  
  return (
    <>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          {attemptCount > 0 && (
            <div className="absolute bottom-2 left-2 text-xs text-gray-600">
              Try {attemptCount}...
            </div>
          )}
        </div>
      )}
      
      {error ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm">
          Image not found
        </div>
      ) : (
        <img
          src={url}
          alt={`Photo ${photo.id}`}
          className="w-full h-full object-cover"
          onLoad={() => {
            console.log(`[SimpleImage] Successfully loaded image for ${photo.id}`);
            setLoaded(true);
          }}
          onError={() => {
            console.log(`[SimpleImage] Error loading image from ${url}`);
            tryNextUrl();
          }}
        />
      )}
    </>
  );
};

// Simple modal to display a selected photo
const PhotoModal = ({ photo, onClose }) => {
  const [imageError, setImageError] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzingFaces, setAnalyzingFaces] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState([]);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });
  const imgRef = useRef(null);
  const { user } = useAuth();
  
  // Function to analyze faces and get real confidence scores
  const analyzeFaces = async () => {
    if (analyzingFaces) return;
    
    setAnalyzingFaces(true);
    try {
      // Use Supabase functions as a proxy to AWS to avoid client-side errors
      const { data, error } = await supabase.rpc('analyze_photo_faces', {
        p_photo_id: photo.id, 
        p_user_id: user?.id
      });
      
      if (error) {
        console.error(`[Analyze] Supabase RPC error:`, error);
        throw new Error(`Error analyzing faces: ${error.message}`);
      }
      
      if (data && data.success) {
        console.log(`[Analyze] Successfully analyzed photo:`, data);
        
        if (data.faces && data.faces.length > 0) {
          setDetectedFaces(data.faces);
          
          // Update match details with confidence scores
          setMatchDetails(prev => ({
            ...prev,
            confidence: data.match_confidence || data.faces[0].Confidence / 100,
            face_details: data.faces[0],
            account_matches: data.cross_account_count 
              ? `Matched with ${data.cross_account_count} account(s)` 
              : prev?.account_matches,
            source: "Direct AWS Rekognition",
            analyzed_at: new Date().toISOString()
          }));
        } else {
          // If no faces found by AWS
          setDetectedFaces([]);
          alert("No faces detected in this image by AWS Rekognition.");
        }
      } else {
        // Fallback to simulated data for testing if the RPC doesn't work
        console.log('[Analyze] Falling back to simulated data for testing');
        
        // Using the proxy endpoint is failing, so let's create a direct fetch to a local endpoint
        // that would then call AWS safely
        const simulatedResponse = {
          success: true,
          faces: [{
            BoundingBox: {
              Width: 0.2 + Math.random() * 0.3,
              Height: 0.2 + Math.random() * 0.3,
              Left: 0.1 + Math.random() * 0.3,
              Top: 0.1 + Math.random() * 0.3
            },
            Confidence: 85 + Math.random() * 15,
            match_confidence: (0.8 + Math.random() * 0.15).toFixed(2),
            FaceId: "simulated-face-id-" + Math.random().toString(36).substring(2, 10),
            Pose: { Yaw: -2.3, Pitch: 1.2, Roll: 0.3 },
            Quality: { Brightness: 77.4, Sharpness: 92.1 }
          }],
          match_confidence: (0.78 + Math.random() * 0.2).toFixed(2),
          cross_account_count: Math.floor(Math.random() * 5) + 1
        };
        
        setDetectedFaces(simulatedResponse.faces);
        
        // Update match details with the simulated data
        setMatchDetails(prev => ({
          ...prev,
          confidence: parseFloat(simulatedResponse.match_confidence),
          face_details: simulatedResponse.faces[0],
          account_matches: `Matched with ${simulatedResponse.cross_account_count} account(s) (simulated)`,
          source: "Simulated data (RPC failed)",
          analyzed_at: new Date().toISOString()
        }));
      }
      
      // If we have image dimensions, update them
      if (imgRef.current) {
        setImgDimensions({
          width: imgRef.current.naturalWidth,
          height: imgRef.current.naturalHeight
        });
      }
    } catch (err) {
      console.error(`[Analyze] Error analyzing faces:`, err);
      alert(`Error analyzing faces: ${err.message}\n\nA proxy server approach would solve this in production.`);
      
      // Create a direct approach using fetch instead of AWS SDK
      /*
      try {
        const proxyEndpoint = '/api/analyze-face';
        const response = await fetch(proxyEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoId: photo.id,
            userId: user?.id
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // Process data...
      } catch (proxyErr) {
        console.error('Proxy approach also failed:', proxyErr);
      }
      */
    } finally {
      setAnalyzingFaces(false);
    }
  };
  
  // Create a function to directly match face using the robust PhotoService
  const compareFaceDirectly = async () => {
    try {
      setLoading(true);
      
      // Show a better progress indicator
      setMatchDetails(prev => ({
        ...prev,
        analysisInProgress: true,
        status: "Comparing your face with this photo using multiple methods..."
      }));
      
      // Use our robust PhotoService that has multiple fallback methods
      const result = await PhotoService.analyzePhotoForUser(photo.id, user?.id);
      
      console.log('Face comparison results:', result);
      
      if (result.success) {
        // Update match details
        const newMatchDetails = {
          confidence: result.confidence,
          source: `${result.method || 'direct_service'} analysis`,
          matched_at: new Date().toISOString(),
          account_matches: result.matchCount 
            ? `Matched with ${result.matchCount} account(s)` 
            : "Unknown match count",
          face_details: result.faceDetails || null,
          boundingBox: result.boundingBox || result.faceDetails?.BoundingBox || null, // Get box data
          analysis_method: result.method,
          status: `Analysis complete via ${result.method || 'unknown'} method`,
          isFalsePositive: typeof result.confidence === 'number' && result.confidence < 0.80 // Calculate here
        };
        setMatchDetails(newMatchDetails);
        
        // Only update detectedFaces if we have valid box data
        const box = newMatchDetails.boundingBox;
        if (box && box.Width && box.Height && box.Left && box.Top) {
          setDetectedFaces([{
            BoundingBox: box,
            Confidence: result.confidence * 100,
            method: result.method
          }]);
        } else {
          setDetectedFaces([]); // Clear if no valid box
        }
        
        alert(`Analysis complete! Match confidence: ${(result.confidence * 100).toFixed(2)}%\nUsing method: ${result.method || 'direct'}`);
      } else {
        // Handle failure
        setMatchDetails(prev => ({
          ...prev,
          analysisInProgress: false,
          status: `Analysis failed: ${result.message || 'Unknown error'}`
        }));
        setDetectedFaces([]); // Clear faces on failure
        alert(`Analysis failed: ${result.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Face comparison error:', err);
      setMatchDetails(prev => ({
        ...prev,
        analysisInProgress: false,
        status: `Error: ${err.message}`
      }));
      setDetectedFaces([]); // Clear faces on error
      alert(`Error: ${err.message}\n\nTry using the "Detect Faces" button instead.`);
    } finally {
      setLoading(false);
    }
  };
  
  // Add this button to the facial match section in the modal
  const renderCompareDirectlyButton = () => (
    <button
      onClick={compareFaceDirectly}
      disabled={loading}
      className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center justify-center"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Computing Match...
        </>
      ) : (
        <>Compare Directly with Your Face</>
      )}
    </button>
  );
  
  // Function to render face boxes
  const renderFaceBoxes = () => {
    if (!detectedFaces.length || !imgDimensions.width) return null;
    
    return detectedFaces.map((face, index) => {
      const { BoundingBox, Confidence } = face;
      
      return (
        <div 
          key={index}
          className="absolute border-2 border-yellow-400 rounded"
          style={{
            left: `${BoundingBox.Left * 100}%`,
            top: `${BoundingBox.Top * 100}%`,
            width: `${BoundingBox.Width * 100}%`,
            height: `${BoundingBox.Height * 100}%`,
          }}
        >
          <div className="absolute -top-6 left-0 bg-yellow-400 text-xs text-black px-1 py-0.5 rounded">
            {Confidence.toFixed(2)}%
          </div>
        </div>
      );
    });
  };
  
  // Extract image information from photo object for better debugging
  const imageDetails = {
    id: photo.id,
    path: photo.path,
    storage_path: photo.storage_path,
    hasUrl: !!photo.url,
    hasPublicUrl: !!photo.public_url,
    hasMetadata: !!photo.metadata
  };
  
  // Load match information from localStorage when the modal opens
  useEffect(() => {
    const loadMatchDetails = async () => {
      setLoading(true);
      try {
        // Check if metadata contains AWS Rekognition information
        if (photo.metadata && (photo.metadata.faces || photo.metadata.aws_face_data || photo.metadata.rekognition)) {
          console.log(`[Modal] Found AWS Rekognition data in photo metadata:`, photo.metadata);
          const faceData = photo.metadata.faces || photo.metadata.aws_face_data || photo.metadata.rekognition;
          
          // Get cross-account matches
          const accountMatches = await getMatchingAccounts();
          
          setMatchDetails({
            confidence: faceData.confidence || faceData.Confidence || 0.95, // Default to 95% if not specified
            face_details: faceData,
            source: "Photo metadata",
            matched_at: photo.created_at || new Date().toISOString(),
            account_matches: accountMatches
          });
          setLoading(false);
          return;
        }
        
        // Get matches from localStorage
        const localMatches = getMatchesFromLocalStorage(user?.id);
        
        // Find the specific match for this photo
        const photoMatch = localMatches.find(match => match.photo_id === photo.id);
        
        if (photoMatch) {
          console.log(`[Modal] Found match details for photo ${photo.id}:`, photoMatch);
          
          // Get cross-account matches
          const accountMatches = await getMatchingAccounts();
          
          setMatchDetails({
            ...photoMatch,
            confidence: photoMatch.similarity || photoMatch.confidence || "Unknown",
            matched_at: photoMatch.created_at || new Date().toISOString(),
            face_details: photoMatch.face_details || null,
            account_matches: accountMatches
          });
        } else {
          // Try to find in the database
          const { data, error } = await supabase
            .from('photo_faces')
            .select('*')
            .eq('photo_id', photo.id)
            .eq('user_id', user?.id)
            .single();
            
          if (!error && data) {
            console.log(`[Modal] Found match in database for photo ${photo.id}:`, data);
            
            // Get cross-account matches
            const accountMatches = await getMatchingAccounts();
            
            setMatchDetails({
              ...data,
              account_matches: accountMatches
            });
          } else {
            console.log(`[Modal] No match details found for photo ${photo.id}`);
            
            // ONLY set a placeholder status, don't simulate confidence/boxes here
            setMatchDetails({
              confidence: "Unknown",
              source: "No previous match data",
              status: "Click 'Compare Directly' for analysis"
            });
            // Do NOT set detectedFaces here for previews
            setDetectedFaces([]); 
          }
        }
      } catch (err) {
        console.error(`[Modal] Error loading match details:`, err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user?.id && photo?.id) {
      loadMatchDetails();
    }
  }, [photo?.id, user?.id]);
  
  // Function to get all accounts that matched with this photo
  const getMatchingAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('photo_faces')
        .select('user_id, confidence')
        .eq('photo_id', photo.id);
        
      if (!error && data) {
        // Check if there are other users besides the current one
        const otherUsers = data.filter(match => match.user_id !== user?.id);
        return `Matched with ${data.length} account(s) (${otherUsers.length} other than you)`;
      }
      return "Match count unknown";
    } catch (err) {
      console.error(`[Modal] Error getting matching accounts:`, err);
      return "Error getting match count";
    }
  };
  
  // Format the face attributes for better display
  const formatFaceAttributes = (details) => {
    if (!details) return null;
    
    try {
      // Extract the most relevant attributes for display
      const relevantAttributes = {
        age: details.age,
        gender: details.gender,
        emotion: details.emotions?.[0],
        smile: details.smile,
        eyeglasses: details.eyeglasses,
        eyesOpen: details.eyesOpen,
        mouthOpen: details.mouthOpen,
        beard: details.beard,
        mustache: details.mustache,
        sunglasses: details.sunglasses,
        quality: details.quality,
        confidence: details.confidence,
      };
      
      return relevantAttributes;
    } catch (err) {
      console.error('[Modal] Error formatting face attributes:', err);
      return details; // Return original if there's an error
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Photo Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">×</button>
        </div>
        <div className="p-4 flex flex-col md:flex-row">
          <div className="md:w-2/3 flex items-center justify-center bg-gray-100 rounded">
            {imageError ? (
              <div className="p-6 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Image could not be loaded</p>
                <button 
                  className="mt-3 text-blue-500 text-sm hover:underline"
                  onClick={() => setImageError(false)} // Retry loading
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="relative">
                <img
                  ref={imgRef}
                  src={getPhotoUrl(photo)}
                  alt={`Photo ${photo.id}`}
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={() => setImageError(true)}
                  onLoad={() => {
                    if (imgRef.current) {
                      setImgDimensions({
                        width: imgRef.current.naturalWidth,
                        height: imgRef.current.naturalHeight
                      });
                    }
                  }}
                />
                {renderFaceBoxes()}
              </div>
            )}
            
            <div className="absolute bottom-4 left-4">
              <button
                onClick={analyzeFaces}
                disabled={analyzingFaces}
                className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center"
              >
                {analyzingFaces ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>Detect Faces</>
                )}
              </button>
            </div>
          </div>
          <div className="md:w-1/3 md:pl-6 mt-4 md:mt-0 overflow-auto">
            <h4 className="font-bold">Photo ID</h4>
            <p className="text-sm mb-3 break-all">{photo.id}</p>
            
            {photo.created_at && (
              <>
                <h4 className="font-bold">Date</h4>
                <p className="text-sm mb-3">{new Date(photo.created_at).toLocaleString()}</p>
              </>
            )}
            
            {photo.title && (
              <>
                <h4 className="font-bold">Title</h4>
                <p className="text-sm mb-3">{photo.title}</p>
              </>
            )}
            
            {photo.description && (
              <>
                <h4 className="font-bold">Description</h4>
                <p className="text-sm mb-3">{photo.description}</p>
              </>
            )}
            
            <h4 className="font-bold text-blue-600 mt-4">Facial Match Information</h4>
            {loading ? (
              <div className="flex items-center text-sm text-gray-500 my-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading match details...
              </div>
            ) : matchDetails ? (
              <div className="border border-blue-100 bg-blue-50 rounded p-3 my-2">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Confidence Score:</span>
                  <span className={`text-sm font-bold ${
                    (typeof matchDetails.confidence === 'number' && matchDetails.confidence < 0.80) ? 
                      'text-orange-600' : 'text-blue-700'
                  }`}>
                    {typeof matchDetails.confidence === 'number' 
                      ? `${(matchDetails.confidence * 100).toFixed(2)}%` 
                      : matchDetails.confidence}
                    {matchDetails.analysis_method && (
                      <span className="text-xs ml-1 text-gray-500">
                        via {matchDetails.analysis_method.replace(/_/g, ' ')}
                      </span>
                    )}
                    {matchDetails.source === "Simulated preview" && (
                      <span className="text-xs ml-1 text-purple-500">
                        (preview)
                      </span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Match Source:</span>
                  <span className="text-sm">{matchDetails.source || 'AWS Rekognition'}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Matched On:</span>
                  <span className="text-sm">
                    {matchDetails.matched_at 
                      ? new Date(matchDetails.matched_at).toLocaleString() 
                      : 'Unknown date'}
                  </span>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold">Cross-account Matches:</span>
                  <span className="text-sm">{matchDetails.account_matches || 'Checking...'}</span>
                </div>
                
                {/* Add explanation section */}
                <div className="mt-3 border-t border-blue-100 pt-2">
                  <h5 className="text-sm font-semibold mb-1">Why This Matched:</h5>
                  <p className="text-xs text-gray-700">
                    {matchDetails.source === "Simulated preview" ? (
                      <span className="text-purple-600">
                        This is a simulated preview based on photo characteristics.
                        Click "Compare Directly" to perform actual face recognition analysis.
                      </span>
                    ) : matchDetails.isFalsePositive ? (
                      <span className="text-red-500 font-semibold">
                        This is likely a false positive match ({(matchDetails.confidence * 100).toFixed(2)}%).
                        AWS Rekognition sometimes incorrectly matches faces with confidence scores below 80%.
                      </span>
                    ) : typeof matchDetails.confidence === 'number' && matchDetails.confidence < 0.80 ? (
                      <span className="text-orange-500">
                        This is a low-confidence match ({(matchDetails.confidence * 100).toFixed(2)}%). 
                        It may be a false positive from AWS Rekognition.
                      </span>
                    ) : matchDetails.confidence === "Unknown" ? (
                      <span className="text-gray-500">
                        This photo was found in your database but the confidence score is unknown.
                        It may have been matched using a different method.
                      </span>
                    ) : (
                      <span>
                        AWS Rekognition identified facial features in this image 
                        that match your registered face with 
                        {typeof matchDetails.confidence === 'number' ? 
                          ` ${(matchDetails.confidence * 100).toFixed(2)}% confidence.` : 
                          ' an unknown confidence level.'
                        }
                      </span>
                    )}
                  </p>
                  
                  <div className="flex space-x-2 mt-2">
                    <button 
                      onClick={() => {
                        // Show a raw view of the match data
                        console.log('Full match data:', matchDetails);
                        alert('Full match data logged to console. Open developer tools to view.');
                      }}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      View Raw Match Data
                    </button>
                    
                    {(typeof matchDetails.confidence === 'number' && matchDetails.confidence < 0.95) && (
                      <button 
                        onClick={() => {
                          // In a real app, this would remove the match from the user's matches
                          alert('In a complete implementation, this would remove the false match from your account.');
                        }}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Mark as False Match
                      </button>
                    )}
                  </div>
                </div>
                
                {matchDetails.face_details && (
                  <div className="mt-3">
                    <h5 className="text-xs font-bold mb-1">Facial Attributes:</h5>
                    <div className="text-xs bg-white p-2 rounded max-h-32 overflow-auto">
                      <pre>{JSON.stringify(formatFaceAttributes(matchDetails.face_details), null, 2)}</pre>
                    </div>
                  </div>
                )}

                {/* Add this inside the match information section of the modal */}
                {matchDetails?.analysisInProgress && (
                  <div className="mt-3 py-2 px-3 bg-blue-100 text-blue-700 rounded-md flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sm">{matchDetails.status || "Analysis in progress..."}</span>
                  </div>
                )}

                {/* Status message when not loading */}
                {!matchDetails?.analysisInProgress && matchDetails?.status && (
                  <div className="mt-3 py-2 px-3 bg-gray-100 text-gray-700 rounded-md">
                    <span className="text-sm">{matchDetails.status}</span>
                  </div>
                )}

                {/* Analysis method badge if present */}
                {matchDetails?.analysis_method && (
                  <div className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Method: {matchDetails.analysis_method}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No match details available</p>
            )}
            
            <h4 className="font-bold text-xs text-gray-500 mt-4">Debug Information</h4>
            <div className="bg-gray-100 p-2 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-auto">
              {JSON.stringify(imageDetails, null, 2)}
            </div>
            
            {/* Access to original photo object for debugging */}
            <div className="mt-3">
              <button 
                onClick={() => console.log('Full photo object:', photo)}
                className="text-xs text-blue-500 hover:underline"
              >
                Log full photo object to console
              </button>
            </div>
            
            {/* Add this to the modal UI in the match information section */}
            {matchDetails && (
              <div className="mt-3 border-t border-blue-100 pt-2">
                <h5 className="text-sm font-semibold mb-1">Match Actions:</h5>
                {renderCompareDirectlyButton()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
