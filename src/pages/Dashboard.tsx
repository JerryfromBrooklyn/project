import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Camera, User, Calendar, Image, Search, Shield, AlertCircle, ChevronDown, Smile, Eye, Ruler, Upload, Ghost as Photos, Trash2, RotateCcw, CheckCircle, Home, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import FaceRegistration from '../components/FaceRegistration';
import { PhotoManager } from '../components/PhotoManager';
import { getFaceDataForUser } from '../services/FaceStorageService';
import { awsPhotoService } from '../services/awsPhotoService';
import { GooeyFilterTabs } from '../components/ui/gooey-filter-tabs';
import TabBarSpacer from "../components/layout/TabBarSpacer";
import TrashBin from '../components/TrashBin';

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
  const [showRegistrationSuccessMessage, setShowRegistrationSuccessMessage] = useState(false);
  const [showHistoricalMatchesMessage, setShowHistoricalMatchesMessage] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      console.warn('[Dashboard] fetchDashboardData skipped: no user ID');
      setIsLoadingFaceData(false);
      return;
    }
    setIsLoadingFaceData(true);
    console.log('[Dashboard] Fetching data for user:', user.id);
    try {
      // Reset state
      setFaceRegistered(false); setFaceImageUrl(null); setFaceAttributes(null); setFaceId(null); setHistoricalMatches([]); setUploadedCount(0); setMatchedCount(0);

      // Fetch face data
      const faceDataResult = await getFaceDataForUser(user.id);
      if (faceDataResult) {
        setFaceRegistered(true);
        setFaceId(faceDataResult.faceId || null);
        setFaceAttributes(faceDataResult.faceAttributes || null);
        setHistoricalMatches(faceDataResult.historicalMatches || []);
        if (faceDataResult.imageUrl) setFaceImageUrl(faceDataResult.imageUrl);
        else if (faceDataResult.imagePath) setFaceImageUrl(`https://shmong.s3.amazonaws.com/face-images/${faceDataResult.imagePath}`);
        else setFaceImageUrl(null);
      }

      // Fetch counts
      const [uploadedPhotos, matchedPhotos] = await Promise.all([
        awsPhotoService.fetchUploadedPhotos(user.id),
        awsPhotoService.fetchPhotos(user.id) // Assuming gets matched
      ]);
      setUploadedCount(uploadedPhotos?.length || 0);
      setMatchedCount(matchedPhotos?.length || 0);
      console.log(`[Dashboard] Counts Updated: Uploaded=${uploadedCount}, Matched=${matchedCount}`);

    } catch (err) {
      console.error('[Dashboard] Error fetching dashboard data:', err);
    } finally {
      setIsLoadingFaceData(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) { document.addEventListener('mousedown', handleClickOutside); }
    else { document.removeEventListener('mousedown', handleClickOutside); }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [isMenuOpen]);

  const handleRegistrationSuccess = (result: any) => {
    console.log('[Dashboard] Face registration successful, refreshing data...');
    setShowRegistrationSuccessMessage(true);
    if (result?.historicalMatches?.length > 0) { setShowHistoricalMatchesMessage(true); }
    setShowRegistrationModal(false);
    fetchDashboardData(); // Refresh dashboard data
  };

  const renderFaceAttributesContent = () => {
    if (!faceAttributes) return null;
    
    console.log('[Dashboard] Rendering face attributes content:', faceAttributes);

    return (
      <div className="space-y-3 text-sm">
        <h3 className="text-base font-semibold text-apple-gray-800 mb-2">Face Details</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1.5 text-apple-gray-400" />
            <span className="text-apple-gray-600">Gender:</span>
            <span className="ml-1 font-medium text-apple-gray-900">{faceAttributes.gender?.value || 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5 text-apple-gray-400" />
            <span className="text-apple-gray-600">Age Range:</span>
            <span className="ml-1 font-medium text-apple-gray-900">{faceAttributes.age ? `${faceAttributes.age.low} - ${faceAttributes.age.high}` : 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <Smile className="w-4 h-4 mr-1.5 text-apple-gray-400" />
            <span className="text-apple-gray-600">Smiling:</span>
            <span className="ml-1 font-medium text-apple-gray-900">{faceAttributes.smile?.value ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1.5 text-apple-gray-400" />
            <span className="text-apple-gray-600">Eyes Open:</span>
            <span className="ml-1 font-medium text-apple-gray-900">{faceAttributes.eyesOpen?.value ? 'Yes' : 'No'}</span>
          </div>
          {/* Add more attributes as needed */}
        </div>
        {/* Render Emotions if available */}
        {faceAttributes.emotions && faceAttributes.emotions.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-medium text-apple-gray-500 mb-1">Detected Emotion:</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {faceAttributes.emotions[0].type} ({Math.round(faceAttributes.emotions[0].confidence)}%)
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderHistoricalMatches = () => {
    if (!showHistoricalMatchesMessage || !historicalMatches || historicalMatches.length === 0) return null;
    
    return (
      <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-3 rounded-r-md">
        <p className="text-sm text-green-800 flex items-center">
          <CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0"/>
          <span className="font-medium">Found you in {historicalMatches.length} existing photo{historicalMatches.length !== 1 ? 's' : ''}!</span>
        </p>
        <p className="text-xs text-green-700 mt-1 pl-6">
          View them in the "My Photos" tab.
        </p>
      </div>
    );
  };

  const renderFaceImageWithAttributes = () => {
    if (isLoadingFaceData) {
      return (
        <div className="flex justify-center items-center py-8 text-apple-gray-400">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-apple-gray-200 border-t-apple-blue-500 rounded-full"
          />
          <span className="ml-2 text-sm">Loading face data...</span>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-apple-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 flex-shrink-0">
            {(user?.full_name || user?.email) && (
              <div className="mb-3 text-sm text-apple-gray-800 font-medium">
                {user?.full_name || user?.email}
              </div>
            )}
            
            {faceImageUrl ? (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-apple-gray-200 bg-apple-gray-100">
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
            ) : (
              <div className="relative aspect-square rounded-lg overflow-hidden border border-apple-gray-200 bg-apple-gray-100 flex items-center justify-center">
                <div className="text-center p-4">
                  <User className="w-12 h-12 mx-auto text-apple-gray-400 mb-2" />
                  <p className="text-xs text-apple-gray-500">Image not available</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1">
            {faceAttributes ? (
              <>
                {renderFaceAttributesContent()}
                {renderHistoricalMatches()}
              </>
            ) : (
              <div className="p-4 bg-apple-gray-50 rounded-lg border border-apple-gray-100 h-full flex items-center justify-center">
                <p className="text-sm text-apple-gray-500 text-center">Face attributes unavailable.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-apple-gray-100 p-6">
              {showRegistrationSuccessMessage && ( <div className="mb-5 bg-green-50 border-l-4 border-green-500 p-3 rounded-r-md"><p className="text-sm text-green-800 flex items-center"><CheckCircle className="w-4 h-4 mr-1.5 flex-shrink-0"/><span className="font-medium">Face registration complete!</span></p></div>)}
              {!faceRegistered && !showRegistrationModal && (<div className="mb-5 bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-md"><p className="text-sm text-amber-800 flex items-center"><AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0"/><span className="font-medium">Register your face to find photos.</span></p></div>)}
              {!faceRegistered && showRegistrationModal && (<div className="mb-6"><FaceRegistration onSuccess={handleRegistrationSuccess} onClose={() => setShowRegistrationModal(false)} /></div>)}
              {faceRegistered && renderFaceImageWithAttributes()}
              {!showRegistrationModal && (<button onClick={() => setShowRegistrationModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg text-base transition-colors flex items-center justify-center w-full md:w-auto"><Camera className="w-4 h-4 mr-2" />{faceRegistered ? "Update Face Registration" : "Register Your Face"}</button>)}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-apple-gray-100 p-5">
                <h2 className="text-sm font-medium text-apple-gray-500 mb-3 flex items-center"><Photos className="w-4 h-4 mr-1.5"/> Photo Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setActiveTab('photos')} className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors"><p className="text-2xl font-semibold text-apple-green-600">{matchedCount}</p><p className="text-xs text-apple-gray-500 mt-0.5">Photos Matched</p></button>
                   <button onClick={() => setActiveTab('upload')} className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors"><p className="text-2xl font-semibold text-apple-blue-600">{uploadedCount}</p><p className="text-xs text-apple-gray-500 mt-0.5">Photos Uploaded</p></button>
                </div>
              </div>
               <div className="bg-white rounded-xl shadow-sm border border-apple-gray-100 p-5">
                 <h2 className="text-sm font-medium text-apple-gray-500 mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-1.5"/> Account Status
                  </h2>
                   <div className="flex items-center p-3 bg-apple-gray-50 rounded-lg mb-3 border border-apple-gray-100">
                    <div className={`w-2.5 h-2.5 rounded-full mr-2.5 ${faceRegistered ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <span className="text-sm font-medium text-apple-gray-800">
                        {faceRegistered ? 'Face Registered' : 'Not Registered'}
                      </span>
                      <p className="text-xs text-apple-gray-500">
                        {faceRegistered ? 'Ready for matching' : 'Complete registration'}
                      </p>
                    </div>
                  </div>
                   <div className="mt-4">
                    <h3 className="text-xs font-medium text-apple-gray-500 mb-1">Privacy Information</h3>
                    <div className="flex items-start text-xs text-apple-gray-500">
                      <AlertCircle className="w-3 h-3 mr-1.5 text-apple-gray-400 flex-shrink-0 mt-0.5" />
                      <p>Your face data is encrypted and stored securely. We never share your biometric data.</p>
                    </div>
                  </div>
               </div>
            </motion.div>
          </div>
        );
      case 'upload':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-apple-gray-100 p-6">
            <h2 className="text-lg font-semibold text-apple-gray-900 flex items-center mb-4">
                <Upload className="w-5 h-5 mr-2 text-apple-gray-500" /> Upload Photos
            </h2>
            <PhotoManager
                mode="upload"
                enableMultiSelect={true}
                onRefresh={fetchDashboardData}
            />
          </div>
        );
      case 'photos':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-apple-gray-100 p-6">
            <h2 className="text-lg font-semibold text-apple-gray-900 flex items-center mb-4">
                <Photos className="w-5 h-5 mr-2 text-apple-gray-500" /> My Photos
            </h2>
            <PhotoManager
                mode="matches"
                enableMultiSelect={true}
                onRefresh={fetchDashboardData}
            />
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            {/* Add your settings component here */}
          </div>
        );
      default:
        return (
          <div className="text-center p-10 text-gray-500">
              Select a tab to view content.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-apple-gray-50 font-sans flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-apple-gray-200 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
          <div className="flex-shrink-0 flex items-center">
            <img src="https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png" alt="SHMONG" className="h-7" />
          </div>
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-2 text-sm font-medium text-apple-gray-700 hover:text-apple-gray-900 focus:outline-none">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-apple-blue-400 to-apple-purple-500 text-white flex items-center justify-center text-xs font-semibold">{(user?.email?.charAt(0) || 'U').toUpperCase()}</div>
              <span className="hidden sm:inline">{user?.email}</span>
              <ChevronDown className={cn("h-4 w-4 text-apple-gray-400 transition-transform", isMenuOpen && "rotate-180")} />
            </button>
            <AnimatePresence>{isMenuOpen && (
              <motion.div 
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
                transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-10"
              >
                <div className="px-3 py-2 border-b border-apple-gray-100">
                  <p className="text-sm font-medium text-apple-gray-900 truncate">
                    {user?.full_name || user?.email}
                  </p>
                  {user?.full_name && (
                  <p className="text-xs text-apple-gray-500 truncate">
                    {user?.email}
                  </p>
                  )}
                </div>
                <button 
                  onClick={() => signOut()}
                  className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-apple-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </button>
              </motion.div>
            )}</AnimatePresence>
          </div>
        </div>
      </header>
      
      <div className="sticky top-14 z-20 bg-white border-b border-apple-gray-200 mb-6 pt-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <GooeyFilterTabs
            tabs={[
              { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
              { id: 'photos', label: 'My Photos', icon: <Photos className="w-4 h-4" /> },
              { id: 'upload', label: 'Upload', icon: <Upload className="w-4 h-4" /> },
              { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            className="max-w-md mx-auto"
          />
        </div>
      </div>
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 pb-24">
        {isLoadingFaceData ? (
             <div className="flex justify-center items-center py-16 text-apple-gray-400">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-6 h-6 border-2 border-apple-gray-200 border-t-apple-blue-500 rounded-full" />
                <span className="ml-2 text-sm">Loading dashboard...</span>
            </div>
        ) : (
            renderContent()
        )}
      </main>
    </div>
  );
};

export default Dashboard;