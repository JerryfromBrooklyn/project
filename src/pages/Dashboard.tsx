import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Camera, User, Calendar, Image, Search, Shield, AlertCircle, ChevronDown, Smile, Eye, Ruler, Upload, Ghost as Photos, Trash2, RotateCcw, CheckCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import FaceRegistration from '../components/FaceRegistration.jsx';
import { PhotoManager } from '../components/PhotoManager';
import { getFaceDataForUser } from '../services/FaceStorageService';
import { awsPhotoService } from '../services/awsPhotoService';
import TabNavigation from '../components/TabNavigation';
import { permanentlyHidePhotos, restorePhotosFromTrash } from '../services/userVisibilityService';
import TabBarSpacer from "../components/layout/TabBarSpacer";
import TrashBin from '../components/TrashBin';
import { EventsGrid } from '../components/EventsGrid';

interface FaceAttributes {
  age: { low: number; high: number };
  smile: { value: boolean; confidence: number };
  eyeglasses: { value: boolean; confidence: number };
  sunglasses: { value: boolean; confidence: number };
  gender: { value: string; confidence: number };
  eyesOpen: { value: boolean; confidence: number };
  mouthOpen: { value: boolean; confidence: number };
  quality: { brightness: number; sharpness: number };
  emotions?: { type: string; confidence: number }[];
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [faceAttributes, setFaceAttributes] = useState<FaceAttributes | null>(null);
  const [faceId, setFaceId] = useState<string | null>(null);
  const [historicalMatches, setHistoricalMatches] = useState<any[]>([]);
  const [isLoadingFaceData, setIsLoadingFaceData] = useState(true);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [trashedPhotos, setTrashedPhotos] = useState([]);
  // State flags for one-time messages
  const [showRegistrationSuccessMessage, setShowRegistrationSuccessMessage] = useState(false);
  const [showHistoricalMatchesMessage, setShowHistoricalMatchesMessage] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null); // Ref for the dropdown menu

  // Define fetchFaceData outside useEffect
  const fetchFaceData = async () => {
    if (!user || !user.id) {
      console.warn('[Dashboard] fetchFaceData called, but user or user.id is not yet available. User:', user);
      return;
    }
    
    setIsLoadingFaceData(true);
    console.log('[Dashboard] Fetching face data for user:', user.id);

    try {
      // Use AWS DynamoDB service instead of Supabase
      console.log('[Dashboard] Fetching face data from DynamoDB...');
      const data = await getFaceDataForUser(user.id);
      
      if (data && data.faceId) { // Check if data exists AND has a faceId
        console.log('🟢 [Dashboard] getFaceDataForUser returned data, setting state...');
        console.log('[Dashboard] Face data found:', data);
        setFaceRegistered(true); // Set registered to true if data and faceId exist
        
        // Set Face ID
        console.log('[Dashboard] Found face ID:', data.faceId);
        setFaceId(data.faceId);

        // Set Face Attributes if they exist
        if (data.faceAttributes) {
          console.log('[Dashboard] Found face attributes:', data.faceAttributes);
          setFaceAttributes(data.faceAttributes);
        } else {
          console.warn('[Dashboard] No face attributes found in data');
          setFaceAttributes(null);
        }
        
        // Set Image URL
        if (data.imageUrl) {
          console.log('[Dashboard] Found image URL:', data.imageUrl);
          setFaceImageUrl(data.imageUrl);
        } else if (data.imagePath) {
          const imageUrl = `https://shmong.s3.amazonaws.com/face-images/${data.imagePath}`;
          console.log('[Dashboard] Constructed image URL from path:', imageUrl);
          setFaceImageUrl(imageUrl);
        } else {
          console.warn('[Dashboard] No image URL found in data');
          setFaceImageUrl(null); // Explicitly set to null if not found
        }
        
        // Set Historical Matches (parse if needed)
        if (data.historicalMatches) {
            if (typeof data.historicalMatches === 'string') {
                try {
                    const parsedMatches = JSON.parse(data.historicalMatches);
                    console.log(`[Dashboard] Found ${parsedMatches.length} historical matches (parsed from string).`);
                    setHistoricalMatches(parsedMatches);
                    // Use historicalMatchCount if available, otherwise use parsed length
                    setMatchedCount(data.historicalMatchCount !== undefined ? data.historicalMatchCount : parsedMatches.length);
                } catch (e) {
                    console.error('[Dashboard] Error parsing historicalMatches JSON:', e);
                    setHistoricalMatches([]);
                    setMatchedCount(0);
                }
            } else if (Array.isArray(data.historicalMatches)) {
                 console.log(`[Dashboard] Found ${data.historicalMatches.length} historical matches (already array).`);
                 setHistoricalMatches(data.historicalMatches);
                 // Use historicalMatchCount if available, otherwise use array length
                 setMatchedCount(data.historicalMatchCount !== undefined ? data.historicalMatchCount : data.historicalMatches.length);
            } else {
                 console.warn('[Dashboard] Historical matches found but is not a string or array:', data.historicalMatches);
                 setHistoricalMatches([]);
                 setMatchedCount(0);
            }
        } else {
            console.log('[Dashboard] No historical matches found in data.');
            setHistoricalMatches([]);
            // Use historicalMatchCount if available (might be 0), otherwise set to 0
            setMatchedCount(data.historicalMatchCount || 0);
        }
      } else { // This covers cases where data is null or data exists but has no faceId
        console.log('[Dashboard] No valid face registration data found for user.');
        setFaceRegistered(false);
        setFaceImageUrl(null);
        setFaceAttributes(null);
        setFaceId(null);
        setHistoricalMatches([]);
        setMatchedCount(0); // Ensure matched count is 0 if not registered
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching face data:', err);
      // Set default state on error
      setFaceRegistered(false);
      setFaceImageUrl(null);
      setFaceAttributes(null);
      setFaceId(null);
      setHistoricalMatches([]);
      setMatchedCount(0);
    } finally {
      setIsLoadingFaceData(false);
    }
  };

  useEffect(() => {
    // Call the relocated fetchFaceData function
    if (user?.id) { // Check if user.id exists before calling
      fetchFaceData();
    }
  }, [user]); // Keep dependency on user

  // New useEffect to fetch photo counts
  useEffect(() => {
    const fetchCounts = async () => {
      if (!user || !user.id) return;

      try {
        console.log('[Dashboard] Fetching photo counts...');
        // Use the correct methods from awsPhotoService
        // @ts-ignore - Method exists in JS implementation
        const uploadedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'uploaded');
        // @ts-ignore - Method exists in JS implementation
        const matchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');

        console.log(`[Dashboard] Fetched counts: Uploaded=${uploadedPhotos.length}, Matched=${matchedPhotos.length}`);
        setUploadedCount(uploadedPhotos.length);
        setMatchedCount(matchedPhotos.length);
      } catch (error) {
        console.error('[Dashboard] Error fetching photo counts:', error);
        setUploadedCount(0);
        setMatchedCount(0);
      }
    };

    fetchCounts();
  }, [user]); // Re-run when user changes

  // Add a function to fetch trashed photos
  useEffect(() => {
    const fetchTrashedPhotos = async () => {
      if (!user || !user.id) return;
      
      setTrashedPhotos([]); // Clear previous trash items
      
      try {
        console.log(`[Dashboard] Fetching trashed photos for user: ${user.id}`);
        // Use the correct getTrashedPhotos function
        // @ts-ignore - Function exists in service, likely a type/import issue
        const trashed = await awsPhotoService.getTrashedPhotos(user.id); 
        console.log(`[Dashboard] Found ${trashed.length} trashed photos`);
        setTrashedPhotos(trashed || []);
      } catch (err) {
        console.error('[Dashboard] Error fetching trashed photos:', err);
        setTrashedPhotos([]);
      }
    };
    
    if (activeTab === 'trash') {
      fetchTrashedPhotos();
    }
  }, [user, activeTab]);

  // Effect to handle clicks outside the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if the menu is open and the click is outside the menu element
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    // Add listener only when the menu is open
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // Remove listener if menu is closed
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup function to remove the listener when the component unmounts or menu closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]); // Dependency array ensures this runs when isMenuOpen changes

  const handleRegistrationSuccess = (result: any) => {
    console.log('[Dashboard] Face registration successful:', { 
      faceId: result?.faceId, 
      attributesCount: result?.faceAttributes ? Object.keys(result.faceAttributes).length : 0,
      matchesCount: result?.historicalMatches?.length || 0 
    });
    
    // Debug the raw attribute data
    console.log('[Dashboard] Raw face attributes received:', result?.faceAttributes);
    
    // Log historical matches if any
    if (result?.historicalMatches && result.historicalMatches.length > 0) {
      console.log('[Dashboard] Historical matches found!', result.historicalMatches.length);
      result.historicalMatches.forEach((match: any, index: number) => {
        console.log(`[Dashboard] Match ${index + 1}:`, match);
      });
    } else {
      console.log('[Dashboard] No historical matches found.');
    }
    
    // --- 1. UPDATE STATE FIRST --- 
    setFaceRegistered(true);
    
    if (result?.faceId) {
      console.log('[Dashboard] Setting faceId:', result.faceId);
      setFaceId(result.faceId);
    }
    
    if (result?.faceAttributes) {
      console.log('[Dashboard] Setting face attributes directly from registration');
      setFaceAttributes(result.faceAttributes);
    }
    
    // Handle historical matches if they exist  
    if (result?.historicalMatches && result.historicalMatches.length > 0) {
      console.log('[Dashboard] Setting historical matches:', result.historicalMatches);
      setHistoricalMatches(result.historicalMatches);
      
      // Update matched count immediately to reflect matches found during registration
      // This ensures the user sees updated stats immediately without waiting for API call
      setMatchedCount(prevCount => {
        const newCount = result.historicalMatches.length;
        console.log(`[Dashboard] Immediately updating matched count from ${prevCount} to ${newCount} based on registration results`);
        return newCount;
      });
    }
    
    // Set image URL if available from the result
    if (result?.imageUrl) {
      console.log('[Dashboard] Setting face image URL from result:', result.imageUrl);
      setFaceImageUrl(result.imageUrl);
    } else {
      // Fallback logic for image URL (keep as is)
      console.warn('[Dashboard] No image URL in registration result, attempting fallbacks.');
      const capturedImage = document.querySelector('.face-registration img[src^="blob:"]');
      if (capturedImage) {
        const img = capturedImage as HTMLImageElement;
        console.log('[Dashboard] Found captured image in DOM, using as fallback');
        setFaceImageUrl(img.src);
      } else if (result?.faceId && user?.id) {
        const fallbackUrl = `https://shmong.s3.amazonaws.com/face-images/${user.id}/${Date.now()}.jpg`;
        console.log('[Dashboard] Using constructed fallback URL:', fallbackUrl);
        setFaceImageUrl(fallbackUrl);
      }
    }

    // --- 2. SET FLAGS TO SHOW ONE-TIME MESSAGES --- 
    setShowRegistrationSuccessMessage(true);
    if (result?.historicalMatches?.length > 0) {
      setShowHistoricalMatchesMessage(true);
    }

    // --- 3. CLOSE MODAL ---
    setShowRegistrationModal(false);

    // --- 4. TRIGGER REFRESH LAST --- 
    console.log('[DASHBOARD] >>> TRIGGERING DASHBOARD DATA REFRESH (AFTER STATE UPDATE) <<<');
    
    // Refresh face data and photo counts
    fetchFaceData();
    
    // Define fetchCounts function inline to ensure it's available
    const fetchCounts = async () => {
      if (!user || !user.id) return;

      try {
        console.log('[Dashboard] Refreshing photo counts after face registration...');
        // Use the correct methods from awsPhotoService
        // @ts-ignore - Method exists in JS implementation
        const uploadedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'uploaded');
        // @ts-ignore - Method exists in JS implementation
        const matchedPhotos = await awsPhotoService.getVisiblePhotos(user.id, 'matched');

        console.log(`[Dashboard] Updated counts: Uploaded=${uploadedPhotos.length}, Matched=${matchedPhotos.length}`);
        setUploadedCount(uploadedPhotos.length);
        setMatchedCount(matchedPhotos.length);
      } catch (error) {
        console.error('[Dashboard] Error fetching photo counts after registration:', error);
        // Don't reset counts to 0 if error occurs, keep current values
      }
    };
    
    // Execute the fetchCounts function
    fetchCounts();
  };
  
  const handleRestorePhoto = async (photoId: string) => {
    if (!user || !user.id || !photoId) return;
    console.log(`[Dashboard] Attempting to restore photo: ${photoId}`);
    try {
      const result = await restorePhotosFromTrash(user.id, [photoId]); // Use imported function
      if (result.success) {
        console.log(`[Dashboard] Photo ${photoId} restored successfully.`);
        // Remove from trashed photos state
        setTrashedPhotos(prev => prev.filter(p => p.id !== photoId));
        // Optionally, update counts or trigger other fetches
      } else {
        throw new Error(result.error || 'Failed to restore photo');
      }
    } catch (err) {
      console.error('[Dashboard] Error restoring photo:', err);
      // Optionally set an error state for the UI
    }
  };

  const handlePermanentDelete = async (photoId: string) => {
    if (!user || !user.id || !photoId) return;
    
    const confirmDelete = window.confirm("Are you sure you want to permanently hide this photo? This action cannot be undone.");
    if (!confirmDelete) return;
    
    try {
      // Use the permanentlyHidePhotos method from userVisibilityService instead
      const result = await permanentlyHidePhotos(user.id, [photoId]);
      
      if (result.success) {
      // Update the trashed photos list
      setTrashedPhotos(trashedPhotos.filter(photo => photo.id !== photoId));
      } else {
        throw new Error(result.error || 'Failed to permanently hide photo');
      }
    } catch (err) {
      console.error('[Dashboard] Error permanently deleting photo:', err);
    }
  };

  const renderFaceAttributes = () => {
    if (!faceAttributes) return null;
    
    console.log('[Dashboard] Rendering face attributes:', faceAttributes);

    // Check if we're dealing with AWS Rekognition format (uppercase keys) or our normalized format
    const isRekognitionFormat = faceAttributes.AgeRange || faceAttributes.Gender;
    
    let parsedAttributes: any = { ...faceAttributes };
    
    // Convert Rekognition format to our normalized format if needed
    if (isRekognitionFormat) {
      console.log('[Dashboard] Converting Rekognition format to normalized format');
      parsedAttributes = {
        age: faceAttributes.AgeRange ? { 
          low: faceAttributes.AgeRange.Low, 
          high: faceAttributes.AgeRange.High 
        } : undefined,
        smile: faceAttributes.Smile ? { 
          value: faceAttributes.Smile.Value, 
          confidence: faceAttributes.Smile.Confidence 
        } : undefined,
        eyeglasses: faceAttributes.Eyeglasses ? { 
          value: faceAttributes.Eyeglasses.Value, 
          confidence: faceAttributes.Eyeglasses.Confidence 
        } : undefined,
        sunglasses: faceAttributes.Sunglasses ? { 
          value: faceAttributes.Sunglasses.Value, 
          confidence: faceAttributes.Sunglasses.Confidence 
        } : undefined,
        gender: faceAttributes.Gender ? { 
          value: faceAttributes.Gender.Value, 
          confidence: faceAttributes.Gender.Confidence 
        } : undefined,
        eyesOpen: faceAttributes.EyesOpen ? { 
          value: faceAttributes.EyesOpen.Value, 
          confidence: faceAttributes.EyesOpen.Confidence 
        } : undefined,
        mouthOpen: faceAttributes.MouthOpen ? { 
          value: faceAttributes.MouthOpen.Value, 
          confidence: faceAttributes.MouthOpen.Confidence 
        } : undefined,
        emotions: faceAttributes.Emotions ? faceAttributes.Emotions.map((e: any) => ({
          type: e.Type,
          confidence: e.Confidence
        })) : undefined
      };
    }

    // Determine the primary emotion (with the highest confidence)
    const primaryEmotion =
      parsedAttributes.emotions && parsedAttributes.emotions.length > 0
        ? parsedAttributes.emotions.reduce((prev: any, curr: any) => (prev.confidence > curr.confidence ? prev : curr))
        : null;

    // Create attributes list - this will work with either normalized format or our converted format
    const attributes = [
      {
        icon: <Smile className="w-4 h-4" />,
        label: "Smile",
        value: parsedAttributes.smile?.value ? "Yes" : "No",
        confidence: parsedAttributes.smile?.confidence || 0
      },
      {
        icon: <Eye className="w-4 h-4" />,
        label: "Eyes Open",
        value: parsedAttributes.eyesOpen?.value ? "Yes" : "No",
        confidence: parsedAttributes.eyesOpen?.confidence || 0
      },
      {
        icon: <Ruler className="w-4 h-4" />,
        label: "Age Range",
        value: `${parsedAttributes.age?.low || 0}-${parsedAttributes.age?.high || 0}`,
        confidence: 100
      },
      {
        icon: <Smile className="w-4 h-4" />,
        label: "Emotion",
        value: primaryEmotion ? primaryEmotion.type : "None",
        confidence: primaryEmotion ? primaryEmotion.confidence : 0
      },
      {
        icon: <User className="w-4 h-4" />,
        label: "Gender",
        value: parsedAttributes.gender?.value || "Unknown",
        confidence: parsedAttributes.gender?.confidence || 0
      }
    ];

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-semibold text-[#3A3A3C] mb-2">Face Attributes</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {attributes.map((attr, index) => (
            <div 
              key={index}
              className="flex items-center p-3 bg-[#F2F2F7] rounded-xl"
            >
              <div className="mr-3 text-[#8E8E93]">
                {attr.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#1C1C1E]">
                  {attr.label}
                </div>
                <div className="text-xs text-[#8E8E93]">
                  {attr.value} ({Math.round(attr.confidence)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistoricalMatches = () => {
    if (!showHistoricalMatchesMessage || !historicalMatches || historicalMatches.length === 0) return null;
    
    return (
      <div className="mt-4 bg-[#E5F9E7] p-4 rounded-xl">
        <p className="text-sm text-[#248A3D] flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0"/>
          <span className="font-semibold">Found you in {historicalMatches.length} existing photo{historicalMatches.length !== 1 ? 's' : ''}!</span>
        </p>
        <p className="text-xs text-[#248A3D] mt-1 ml-6">
          View them in the "My Photos" tab.
        </p>
      </div>
    );
  };

  const renderFaceImageWithAttributes = () => {
    if (isLoadingFaceData) {
      return (
        <div className="flex justify-center items-center py-8 text-[#8E8E93]">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-[#D1D1D6] border-t-[#007AFF] rounded-full"
          />
          <span className="ml-2 text-sm">Loading face data...</span>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 flex-shrink-0">
            {(user?.full_name || user?.email) && (
              <div className="mb-3 text-sm text-[#1C1C1E] font-semibold">
                {user?.full_name || user?.email}
              </div>
            )}
            
            {faceImageUrl ? (
              <div className="flex flex-col">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F2F2F7]">
                  <img 
                    src={encodeURI(faceImageUrl || '')}
                    alt="Registered face" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      if (!e.currentTarget.classList.contains('error-image')) {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM4ODg4ODgiPkZhY2UgSW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+';
                        e.currentTarget.classList.add('error-image');
                      }
                    }}
                  />
                </div>
                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="mt-4 bg-[#007AFF] text-white font-semibold py-3 px-4 rounded-2xl text-sm transition-colors flex items-center justify-center"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Update Face Registration
                </button>
              </div>
            ) : (
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F2F2F7] flex items-center justify-center">
                <div className="text-center p-4">
                  <User className="w-12 h-12 mx-auto text-[#8E8E93] mb-2" />
                  <p className="text-xs text-[#8E8E93]">Image not available</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1">
            {faceAttributes ? (
              <>
                {renderFaceAttributes()}
                {renderHistoricalMatches()}
              </>
            ) : (
              <div className="p-4 bg-[#F2F2F7] rounded-xl h-full flex items-center justify-center">
                <p className="text-sm text-[#8E8E93] text-center">Face attributes unavailable.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-xl font-semibold text-[#1C1C1E] flex items-center">
                <Upload className="w-5 h-5 mr-2 text-[#8E8E93]" />
                Upload Photos
              </h2>
            </div>
            <p className="text-sm text-[#636366] mb-6">
              Upload photos to be indexed. Other users matched in these photos will be able to view them.
            </p>
            <PhotoManager mode="upload" />
          </div>
        );
      case 'photos':
        return (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-xl font-semibold text-[#1C1C1E] flex items-center">
                <Photos className="w-5 h-5 mr-2 text-[#8E8E93]" />
                My Photos
              </h2>
            </div>
            <p className="text-sm text-[#636366] mb-6">
              Photos where your registered face has been identified.
            </p>
            <PhotoManager mode="matches" nativeShare={true} />
          </div>
        );
      case 'events':
        return (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-xl font-semibold text-[#1C1C1E] flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#8E8E93]" />
                Events
              </h2>
            </div>
            <p className="text-sm text-[#636366] mb-6">
              The Events feature is temporarily unavailable while we make improvements.
            </p>
            <div className="text-center p-8 bg-[#F2F2F7] rounded-xl">
              <Calendar className="w-10 h-10 mx-auto text-[#8E8E93] mb-3" />
              <p className="text-sm text-[#8E8E93]">Event functionality coming soon.</p>
            </div>
          </div>
        );
      case 'trash':
        return (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E5E5EA]">
              <h2 className="text-xl font-semibold text-[#1C1C1E] flex items-center">
                <Trash2 className="w-5 h-5 mr-2 text-[#8E8E93]" />
                Trash
              </h2>
              <div className="text-center bg-[#F2F2F7] px-3.5 py-1.5 rounded-full">
                <span className="text-sm font-semibold text-[#3A3A3C]">{trashedPhotos.length}</span>
                <span className="text-xs text-[#8E8E93] ml-1">items</span>
              </div>
            </div>
            <p className="text-sm text-[#636366] mb-6">
              Items you've hidden. They will be permanently removed after 30 days.
            </p>
            <TrashBin userId={user?.id} />
          </div>
        );
      default:
        return (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Photo Stats - always first on mobile and desktop */}
            <div className="order-1 lg:col-start-3">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-5"
              >
                <h2 className="text-sm font-semibold text-[#3A3A3C] mb-3 flex items-center">
                  <Photos className="w-4 h-4 mr-1.5"/> Photo Stats
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('photos')}
                    className="text-center p-3 rounded-xl hover:bg-[#F2F2F7] transition-colors"
                  >
                    <p className="text-2xl font-semibold text-[#34C759]">{matchedCount}</p>
                    <p className="text-xs text-[#8E8E93] mt-0.5">Photos Matched</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="text-center p-3 rounded-xl hover:bg-[#F2F2F7] transition-colors"
                  >
                    <p className="text-2xl font-semibold text-[#007AFF]">{uploadedCount}</p>
                    <p className="text-xs text-[#8E8E93] mt-0.5">Photos Uploaded</p>
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Main content with face registration - middle on mobile, main area on desktop */}
            <div className="order-2 lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-sm p-5"
              >
                {showRegistrationSuccessMessage && (
                  <div className="mb-5 bg-[#E5F9E7] p-4 rounded-xl">
                    <p className="text-sm text-[#248A3D] flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0"/>
                      <span className="font-semibold">Face registration complete!</span>
                    </p>
                  </div>
                )}
                
                {!faceRegistered && !showRegistrationModal && (
                  <div className="mb-5 bg-[#FFF8E6] p-4 rounded-xl">
                    <p className="text-sm text-[#BB8605] flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0"/>
                      <span className="font-semibold">Register your face to find photos.</span>
                    </p>
                  </div>
                )}

                {!faceRegistered && showRegistrationModal && (
                  <div className="mb-6">
                    <FaceRegistration 
                      onSuccess={handleRegistrationSuccess} 
                      onClose={() => setShowRegistrationModal(false)} 
                    />
                  </div>
                )}

                {faceRegistered && renderFaceImageWithAttributes()}
                
                {!faceRegistered && !showRegistrationModal && (
                  <button
                    onClick={() => setShowRegistrationModal(true)}
                    className="bg-[#007AFF] text-white font-semibold py-3.5 px-6 rounded-2xl text-base transition-colors flex items-center justify-center w-full md:w-auto"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Register Your Face
                  </button>
                )}
              </motion.div>
            </div>

            {/* Account Status - always last on mobile and desktop */}
            <div className="order-3 lg:col-start-3">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm p-5"
              >
                <h2 className="text-sm font-semibold text-[#3A3A3C] mb-3 flex items-center">
                  <Shield className="w-4 h-4 mr-1.5"/> Account Status
                </h2>
                <div className="flex items-center p-3.5 bg-[#F2F2F7] rounded-xl mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full mr-3 ${faceRegistered ? 'bg-[#34C759]' : 'bg-[#FF9500]'}`}></div>
                  <div>
                    <span className="text-sm font-semibold text-[#1C1C1E]">
                      {faceRegistered ? 'Face Registered' : 'Not Registered'}
                    </span>
                    <p className="text-xs text-[#8E8E93]">
                      {faceRegistered ? 'Ready for matching' : 'Complete registration'}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-[#636366] mb-1">Privacy Information</h3>
                  <div className="flex items-start text-xs text-[#636366]">
                    <AlertCircle className="w-3 h-3 mr-1.5 text-[#8E8E93] flex-shrink-0 mt-0.5" />
                    <p>Your face data is secured with bank and military-grade encryption</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif" }}>
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg pt-safe">
        <div className="mx-auto px-4">
          <div className="flex justify-between h-12 items-center">
            <div className="flex-shrink-0 flex items-center">
              <img src="https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png" alt="SHMONG" className="h-7" />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-sm font-medium text-[#3A3A3C] hover:text-[#1C1C1E] focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#007AFF] to-[#5856D6] text-white flex items-center justify-center text-xs font-semibold">
                  {(user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                <span className="hidden sm:inline">{user?.email}</span>
                <ChevronDown className={cn("h-4 w-4 text-[#8E8E93] transition-transform", isMenuOpen && "rotate-180")} />
              </button>
              
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black/5 focus:outline-none py-1 z-10"
                  >
                    <div className="px-4 py-3 border-b border-[#E5E5EA]">
                      <p className="text-sm font-semibold text-[#1C1C1E] truncate">
                        {user?.full_name || user?.email}
                      </p>
                      {user?.full_name && (
                      <p className="text-xs text-[#8E8E93] truncate">
                        {user?.email}
                      </p>
                      )}
                    </div>
                    <button 
                      onClick={() => signOut()}
                      className="flex items-center w-full text-left px-4 py-3 text-sm text-[#FF3B30] hover:bg-[#F2F2F7]"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Add top spacing for fixed header */}
      <div className="h-12 pt-safe"></div>
      
      {/* Tab Navigation moved to top under header */}
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
      />

      <main className="mx-auto px-4 py-4 sm:py-6">
        <div className={cn(
          activeTab === 'home' ? "" : ""
        )}>
          {renderContent()}
        </div>
      </main>

      <AnimatePresence>
        {showRegistrationModal && (
           <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-4"
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={{ type: "spring", damping: 20, stiffness: 200 }}
               className="relative w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl overflow-hidden"
             >
               <FaceRegistration
                 onSuccess={handleRegistrationSuccess}
                 onClose={() => setShowRegistrationModal(false)}
               />
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add bottom spacing for safe area */}
      <div className="h-8 pb-safe"></div>
    </div>
  );
};

export default Dashboard;