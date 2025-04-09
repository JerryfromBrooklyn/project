import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Camera, User, Calendar, Image, Search, Shield, AlertCircle, ChevronDown, Smile, Eye, Ruler, Upload, Ghost as Photos } from 'lucide-react';
import { cn } from '../utils/cn';
import FaceRegistration from '../components/FaceRegistration';
import { PhotoManager } from '../components/PhotoManager';
import { getFaceDataForUser } from '../services/FaceStorageService';

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

  useEffect(() => {
    const fetchFaceData = async () => {
      if (!user) return;
      
      setIsLoadingFaceData(true);
      console.log('[Dashboard] Fetching face data for user:', user.id);

      try {
        // Use AWS DynamoDB service instead of Supabase
        console.log('[Dashboard] Fetching face data from DynamoDB...');
        const data = await getFaceDataForUser(user.id);
        
        if (data) {
          console.log('[Dashboard] Face data found:', data);
          setFaceRegistered(true);
          
          if (data.faceId) {
            console.log('[Dashboard] Found face ID:', data.faceId);
            setFaceId(data.faceId);
          } else {
            console.warn('[Dashboard] No face ID found in data');
            setFaceId(null);
          }
          
          if (data.faceAttributes) {
            console.log('[Dashboard] Found face attributes:', data.faceAttributes);
            setFaceAttributes(data.faceAttributes);
          } else {
            console.warn('[Dashboard] No face attributes found in data');
          }
          
          if (data.imageUrl) {
            console.log('[Dashboard] Found image URL:', data.imageUrl);
            setFaceImageUrl(data.imageUrl);
          } else if (data.imagePath) {
            const imageUrl = `https://shmong.s3.amazonaws.com/face-images/${data.imagePath}`;
            console.log('[Dashboard] Constructed image URL from path:', imageUrl);
            setFaceImageUrl(imageUrl);
          } else {
            console.warn('[Dashboard] No image URL found in data');
          }
          
          if (data.historicalMatches && data.historicalMatches.length > 0) {
            console.log('[Dashboard] Found historical matches:', data.historicalMatches.length);
            setHistoricalMatches(data.historicalMatches);
          }
        } else {
          console.log('[Dashboard] No face data found for user');
          setFaceRegistered(false);
          setFaceImageUrl(null);
          setFaceAttributes(null);
          setFaceId(null);
          setHistoricalMatches([]);
        }
      } catch (err) {
        console.error('[Dashboard] Error fetching face data:', err);
        // Set default state on error
        setFaceRegistered(false);
        setFaceImageUrl(null);
        setFaceAttributes(null);
        setFaceId(null);
        setHistoricalMatches([]);
      } finally {
        setIsLoadingFaceData(false);
      }
    };

    fetchFaceData();
  }, [user]);

  const handleRegistrationSuccess = (result: any) => {
    console.log('[Dashboard] Face registration successful:', { 
      faceId: result?.faceId, 
      attributesCount: result?.faceAttributes ? Object.keys(result.faceAttributes).length : 0,
      matchesCount: result?.historicalMatches?.length || 0 
    });
    
    // Debug the raw attribute data
    console.log('[Dashboard] Raw face attributes received:', result?.faceAttributes);
    
    // Immediately update the UI with the data we just received
    setFaceRegistered(true);
    setShowRegistrationModal(false);
    
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
    }
    
    // Set image URL if available from the result
    if (result?.imageUrl) {
      console.log('[Dashboard] Setting face image URL from result:', result.imageUrl);
      setFaceImageUrl(result.imageUrl);
    } else {
      // Fallback to looking for an image element in the face registration modal
      const capturedImage = document.querySelector('.face-registration img[src^="blob:"]');
      if (capturedImage) {
        const img = capturedImage as HTMLImageElement;
        console.log('[Dashboard] Found captured image in DOM, using as fallback');
        setFaceImageUrl(img.src);
      } else if (result?.faceId && user?.id) {
        // Final fallback - construct URL from what we know
        const fallbackUrl = `https://shmong.s3.amazonaws.com/face-images/${user.id}/${Date.now()}.jpg`;
        console.log('[Dashboard] Using constructed fallback URL:', fallbackUrl);
        setFaceImageUrl(fallbackUrl);
      }
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
        <h4 className="text-sm font-medium text-apple-gray-700">Face Attributes</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {attributes.map((attr, index) => (
            <div 
              key={index}
              className="flex items-center p-2 bg-apple-gray-50 rounded-apple"
            >
              <div className="mr-2 text-apple-gray-500">
                {attr.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-apple-gray-900">
                  {attr.label}
                </div>
                <div className="text-xs text-apple-gray-500">
                  {attr.value} ({Math.round(attr.confidence)}% confidence)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderHistoricalMatches = () => {
    if (!historicalMatches || historicalMatches.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-apple-gray-700 mb-2">Historical Matches</h4>
        <div className="bg-green-50 p-3 rounded-apple border border-green-200">
          <p className="text-sm text-green-800">
            <span className="font-medium">Found you in {historicalMatches.length} existing photo{historicalMatches.length !== 1 ? 's' : ''}!</span>
          </p>
          <p className="text-xs text-green-600 mt-1">
            These photos are viewable in the "My Photos" tab.
          </p>
        </div>
      </div>
    );
  };

  const renderFaceImageWithAttributes = () => {
    if (isLoadingFaceData) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-apple-blue-500"></div>
        </div>
      );
    }

    // If not loading and not registered, don't show anything
    if (!faceRegistered && !faceAttributes) {
      return null;
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium text-apple-gray-800 mb-4 border-b border-apple-gray-200 pb-2">
          Your Registered Face
        </h3>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            {faceImageUrl ? (
              <div className="relative aspect-square rounded-apple-xl overflow-hidden border-2 border-apple-blue-200 shadow-md">
                <img 
                  src={faceImageUrl} 
                  alt="Registered face" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Handle image loading errors
                    console.error('[Dashboard] Error loading face image:', e);
                    // Set a fallback image or placeholder
                    e.currentTarget.src = 'https://via.placeholder.com/400?text=Face+Image+Unavailable';
                    e.currentTarget.classList.add('error-image');
                  }}
                />
              </div>
            ) : (
              <div className="relative aspect-square rounded-apple-xl overflow-hidden border-2 border-apple-gray-200 bg-apple-gray-100 shadow-md flex items-center justify-center">
                <div className="text-center p-4">
                  <User className="w-16 h-16 mx-auto text-apple-gray-400 mb-2" />
                  <p className="text-sm text-apple-gray-500">Face image not available</p>
                </div>
              </div>
            )}
            {faceId && (
              <div className="mt-2 text-xs text-apple-gray-500 bg-apple-gray-50 p-2 rounded border border-apple-gray-200">
                <span className="font-medium">Face ID:</span> {faceId.substring(0, 8)}...
              </div>
            )}
          </div>
          <div className="md:w-2/3">
            {faceAttributes ? (
              <>
                {renderFaceAttributes()}
                {renderHistoricalMatches()}
              </>
            ) : (
              <div className="p-4 bg-apple-gray-50 rounded-apple border border-apple-gray-200">
                <p className="text-sm text-apple-gray-500">
                  Face attributes not available
                </p>
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
          <div className="bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold text-apple-gray-900 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-apple-blue-500" />
                Upload Photos
              </h2>
            </div>
            <p className="text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple">
              Upload photos to be indexed for facial recognition. Other users will be able to find photos they appear in.
            </p>
            <PhotoManager mode="upload" />
          </div>
        );
      case 'photos':
        return (
          <div className="bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-apple-gray-900 flex items-center">
                <Photos className="w-5 h-5 mr-2 text-apple-blue-500" />
                My Photos
              </h2>
            </div>
            <p className="text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple">
              Photos where you have been identified through facial recognition.
            </p>
            <PhotoManager mode="matches" />
          </div>
        );
      case 'events':
        return (
          <div className="bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-apple-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-apple-blue-500" />
                Events
              </h2>
            </div>
            <p className="text-apple-gray-500">No events found.</p>
          </div>
        );
      default:
        return (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100"
            >
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-full bg-apple-blue-100 text-apple-blue-700 flex items-center justify-center mr-4 text-xl font-semibold">
                  {(user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-apple-gray-900">
                    Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
                  </h1>
                  <p className="text-apple-gray-500">
                    {faceRegistered ? 'Your face is registered' : 'Complete your profile by registering your face'}
                  </p>
                </div>
              </div>
              
              <p className="text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple">
                {faceRegistered 
                  ? "Your face has been registered. You can now use the facial recognition feature for quick authentication."
                  : "Get started by registering your face to enable quick authentication and find your photos at events."}
              </p>

              {renderFaceImageWithAttributes()}
              
              <button
                onClick={() => setShowRegistrationModal(true)}
                className="ios-button-primary flex items-center"
              >
                <Camera className="w-5 h-5 mr-2" />
                {faceRegistered ? "Re-Register Face" : "Register Your Face"}
              </button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100"
            >
              <h2 className="text-lg font-medium text-apple-gray-900 mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-apple-blue-500" />
                Face Recognition Status
              </h2>
              <div className="flex items-center p-4 bg-apple-gray-50 rounded-apple mb-4 border border-apple-gray-200">
                <div className={`w-3 h-3 rounded-full mr-3 ${faceRegistered ? 'bg-apple-green-500' : 'bg-amber-500'}`}></div>
                <div>
                  <span className="text-sm font-medium text-apple-gray-900">
                    {faceRegistered ? 'Registered' : 'Not Registered'}
                  </span>
                  <p className="text-xs text-apple-gray-500 mt-1">
                    {faceRegistered 
                      ? "Last updated: Today"
                      : "Register to enhance security"}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-medium text-apple-gray-900 mb-2">Privacy information</h3>
                <div className="flex items-start text-xs text-apple-gray-600">
                  <AlertCircle className="w-4 h-4 mr-2 text-apple-gray-400 flex-shrink-0 mt-0.5" />
                  <p>Your face data is encrypted and stored securely. We never share your biometric data with third parties.</p>
                </div>
              </div>
            </motion.div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-apple-gray-50 font-sans">
      {/* Header/Navigation */}
      <header className="backdrop-navbar sticky top-0 z-40 pt-ios-safe">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl">
              <img src="https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png" alt="SHMONG.tv" className="h-8" />
            </div>
            
            {/* Profile dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-sm text-apple-gray-700 bg-apple-gray-100 px-3 py-2 rounded-apple hover:bg-apple-gray-200 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-apple-blue-100 text-apple-blue-700 flex items-center justify-center">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden md:inline font-medium">{user?.email}</span>
                <ChevronDown className="h-4 w-4 text-apple-gray-500" />
              </button>
              
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-apple-xl shadow-apple-lg py-2 z-10 border border-apple-gray-100"
                >
                  <div className="px-4 py-2 border-b border-apple-gray-100">
                    <p className="text-sm font-medium text-apple-gray-900">
                      {user?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-apple-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button 
                    onClick={() => signOut()}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-apple-red-500 hover:bg-apple-gray-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-ios-safe">
        {/* Tabs */}
        <div className="flex overflow-x-auto mb-8 pb-2 no-scrollbar">
          <nav className="flex space-x-2 mx-auto bg-apple-gray-200 p-1 rounded-full">
            {[
              { id: 'home', name: 'Home', icon: <User className="w-4 h-4" /> },
              { id: 'upload', name: 'Upload', icon: <Upload className="w-4 h-4" /> },
              { id: 'photos', name: 'My Photos', icon: <Image className="w-4 h-4" /> },
              { id: 'events', name: 'Events', icon: <Calendar className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-white text-apple-gray-900 shadow-apple-button"
                    : "text-apple-gray-600 hover:text-apple-gray-900"
                )}
              >
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className={cn(
          "grid gap-8",
          activeTab === 'home' ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
        )}>
          {renderContent()}
        </div>
      </main>

      <AnimatePresence>
        {showRegistrationModal && (
          <FaceRegistration
            onSuccess={handleRegistrationSuccess}
            onClose={() => setShowRegistrationModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;