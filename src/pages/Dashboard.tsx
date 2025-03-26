import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Camera, User, Calendar, Image, Search, Shield, AlertCircle, ChevronDown, Smile, Eye, Ruler, Upload, Ghost as Photos } from 'lucide-react';
import { cn } from '../utils/cn';
import { FaceRegistration } from '../components/FaceRegistration';
import { PhotoManager } from '../components/PhotoManager';
import { supabase } from '../lib/supabaseClient';

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

  useEffect(() => {
    const fetchFaceData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('face_data')
          .select('face_data')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(); // Use maybeSingle instead of single

        if (error) {
          // Only throw if it's not a "no rows returned" error
          if (!error.message.includes('JSON object requested, multiple (or no) rows returned')) {
            throw error;
          }
          // If no rows, just set the state accordingly
          setFaceRegistered(false);
          setFaceImageUrl(null);
          setFaceAttributes(null);
          return;
        }

        if (data) {
          setFaceRegistered(true);
          setFaceAttributes(data.face_data.attributes || null);
          const { data: { publicUrl } } = supabase.storage
            .from('face-data')
            .getPublicUrl(data.face_data.image_path);
          setFaceImageUrl(publicUrl);
        } else {
          // No data case
          setFaceRegistered(false);
          setFaceImageUrl(null);
          setFaceAttributes(null);
        }
      } catch (err) {
        console.error('Error fetching face data:', err);
        // Set default state on error
        setFaceRegistered(false);
        setFaceImageUrl(null);
        setFaceAttributes(null);
      }
    };

    fetchFaceData();
  }, [user]);

  const handleRegistrationSuccess = () => {
    setFaceRegistered(true);
    setShowRegistrationModal(false);
    // Refetch face data to get the new image URL and attributes
    if (user) {
      supabase
        .from('face_data')
        .select('face_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() // Use maybeSingle here too
        .then(({ data, error }) => {
          if (!error && data) {
            setFaceAttributes(data.face_data.attributes || null);
            const { data: { publicUrl } } = supabase.storage
              .from('face-data')
              .getPublicUrl(data.face_data.image_path);
            setFaceImageUrl(publicUrl);
          }
        });
    }
  };

  const renderFaceAttributes = () => {
    if (!faceAttributes) return null;

    // Determine the primary emotion (with the highest confidence)
    const primaryEmotion =
      faceAttributes.emotions && faceAttributes.emotions.length > 0
        ? faceAttributes.emotions.reduce((prev, curr) => (prev.confidence > curr.confidence ? prev : curr))
        : null;

    const attributes = [
      {
        icon: <Smile className="w-4 h-4" />,
        label: "Smile",
        value: faceAttributes.smile.value ? "Yes" : "No",
        confidence: faceAttributes.smile.confidence
      },
      {
        icon: <Eye className="w-4 h-4" />,
        label: "Eyes Open",
        value: faceAttributes.eyesOpen.value ? "Yes" : "No",
        confidence: faceAttributes.eyesOpen.confidence
      },
      {
        icon: <Ruler className="w-4 h-4" />,
        label: "Age Range",
        value: `${faceAttributes.age.low}-${faceAttributes.age.high}`,
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
        value: faceAttributes.gender.value,
        confidence: faceAttributes.gender.confidence
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
                  {(user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-apple-gray-900">
                    Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}
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

              {faceImageUrl && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-apple-gray-700 mb-2">Your Registered Face</h3>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative w-full max-w-xs aspect-square rounded-apple-xl overflow-hidden border border-apple-gray-200">
                      <img 
                        src={faceImageUrl} 
                        alt="Registered face" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {renderFaceAttributes()}
                  </div>
                </div>
              )}
              
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
                      {user?.user_metadata?.full_name || 'User'}
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