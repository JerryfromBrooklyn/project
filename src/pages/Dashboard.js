import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Camera,
  User,
  Calendar,
  Image,
  Shield,
  AlertCircle,
  ChevronDown,
  Smile,
  Eye,
  Ruler,
  Upload,
  ImageIcon as Photos,
  Settings,
  AlertTriangle,
  Heart,
  Scissors,
  Search,
  Sun,
  MessageCircle,
  Compass,
  Zap,
  Glasses,
} from "lucide-react";
import { cn } from "../utils/cn";
import { FaceRegistration } from "../components/FaceRegistration";
import { PhotoManager } from "../components/PhotoManager.tsx";
import {
  getFaceData,
  getUserById,
} from "../services/database-utils.js";
import DebugToolbar from "../components/DebugToolbar";
import { normalizeToS3Url } from '../utils/s3Utils';

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [faceImageUrl, setFaceImageUrl] = useState(null);
  const [faceAttributes, setFaceAttributes] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) return;

      try {
        console.log('[Dashboard] Fetching user data for:', user.id);
        const userResult = await getUserById(user.id);
        if (userResult.success && userResult.data) {
          setIsAdmin(userResult.data.role === 'admin');
        } else {
          console.warn('[Dashboard] Could not fetch user profile data:', userResult.error);
          setIsAdmin(false);
        }

        console.log('[Dashboard] Fetching face data for:', user.id);
        const faceResult = await getFaceData(user.id);
        if (faceResult.success && faceResult.data) {
            setFaceRegistered(true);
            
            // Log full face data for debugging in a collapsible group
            console.groupCollapsed('📊 [Dashboard] Raw face data:');
            console.log(JSON.stringify(faceResult.data, null, 2));
            console.groupEnd();
            
            // Extract face details - we need to handle multiple possible formats
            let faceDetail = null;
            
            // Check all possible attribute locations based on response structure
            if (faceResult.data.faceId) {
              // Simple structure with direct faceId
              faceDetail = { faceId: faceResult.data.faceId };
            } else if (faceResult.data.face_detail) {
              // Nested face_detail structure
              faceDetail = faceResult.data.face_detail;
            } else if (faceResult.data.face_data?.attributes) {
              // Nested face_data.attributes structure
              faceDetail = faceResult.data.face_data.attributes;
            } else if (faceResult.data.Attributes) {
              // Direct Attributes structure
              faceDetail = faceResult.data.Attributes;
            } else if (typeof faceResult.data === 'object') {
              // Last resort, use entire data object
              faceDetail = faceResult.data;
            }
            
            console.groupCollapsed('🧩 [Dashboard] Extracted face details:');
            console.log(JSON.stringify(faceDetail, null, 2));
            console.groupEnd();
            
            // Try to get the image URL directly or from the nested structure
            let imageUrl = faceResult.data.public_url || 
                          (faceResult.data.face_data?.M?.public_url?.S);
            
            if (imageUrl) {
              console.log('🖼️ [Dashboard] Found image URL in data:', imageUrl);
              
              // Normalize to S3 URL format
              imageUrl = normalizeToS3Url(imageUrl);
              console.log('�� [Dashboard] Normalized S3 URL:', imageUrl);
              
              setFaceImageUrl(imageUrl);
            } else {
              console.log('⚠️ [Dashboard] No image URL found in face data');
            }
            
            setFaceAttributes(faceDetail);
            
            console.log('✅ [Dashboard] Face data processed:', {
              hasAttributes: !!faceDetail,
              hasImageUrl: !!imageUrl
            });
        } else {
          console.log('[Dashboard] No face data found for user or error:', faceResult.error);
          setFaceRegistered(false);
          setFaceImageUrl(null);
          setFaceAttributes(null);
        }
      } catch (err) {
        console.error("[Dashboard] Error fetching user/face data:", err);
        setFaceRegistered(false);
        setFaceImageUrl(null);
        setFaceAttributes(null);
        setIsAdmin(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleRegistrationSuccess = (faceId, directFaceAttributes) => {
    setFaceRegistered(true);
    setShowRegistrationModal(false);
    console.log('[Dashboard] Face registered, attempting to refetch user data...');
    
    // Log received face attributes in detail to diagnose any issues
    if (directFaceAttributes) {
      console.groupCollapsed('📊 [Dashboard] Direct face attributes received:');
      console.log(JSON.stringify(directFaceAttributes, null, 2));
      console.groupEnd();
      
      // Make sure directFaceAttributes are in the proper format for our rendering logic
      let formattedAttributes = directFaceAttributes;
      
      // Check if we need to convert or parse
      if (typeof directFaceAttributes === 'string') {
        try {
          console.log('🔄 [Dashboard] Attempting to parse string face attributes from registration');
          formattedAttributes = JSON.parse(directFaceAttributes);
        } catch (e) {
          console.error('❌ [Dashboard] Error parsing face_attributes string from registration:', e);
        }
      }
      
      // Store the face attributes directly since they're available
      setFaceAttributes(formattedAttributes);
      
      // Log the stored attributes for verification
      console.log('[Dashboard] Stored face attributes from registration:', 
        Object.keys(formattedAttributes).join(', '));
    } else {
      console.log('[Dashboard] No direct face attributes received');
    }
    
    // Still try to refetch from DynamoDB to get the image URL and ensure data consistency
    setTimeout(() => {
      const fetchUserDataAgain = async () => {
        if (!user || !user.id) return;
        
        console.log('[Dashboard] Refetching face data after registration');
        const faceResult = await getFaceData(user.id);
        
        if (faceResult.success && faceResult.data) {
           setFaceRegistered(true);
           
           // Log full face data for debugging
           console.groupCollapsed('📊 [Dashboard] Raw face data after registration:');
           console.log(JSON.stringify(faceResult.data, null, 2));
           console.groupEnd();
           
           // Set image URL if available
           if (faceResult.data.public_url) {
             setFaceImageUrl(faceResult.data.public_url);
           }
           
           // Only update face attributes from DynamoDB if we don't have them directly
           // This preserves the richer attribute set we may have received directly
           if (!directFaceAttributes && faceResult.data.face_attributes) {
             console.log('[Dashboard] Setting face attributes from DynamoDB');
             
             // Handle the case where face_attributes might be a string that needs parsing
             let dbFaceAttributes = faceResult.data.face_attributes;
             if (typeof dbFaceAttributes === 'string') {
               try {
                 dbFaceAttributes = JSON.parse(dbFaceAttributes);
                 console.log('[Dashboard] Successfully parsed face_attributes from DynamoDB');
               } catch (e) {
                 console.error('[Dashboard] Error parsing face_attributes from DynamoDB:', e);
               }
             }
             
             setFaceAttributes(dbFaceAttributes);
           }
           
           // If we still don't have face attributes but have face_data with nested face_detail
           // This handles the 400 error case response format
           if (!faceAttributes && faceResult.data.face_data && faceResult.data.face_data.face_detail) {
             console.log('[Dashboard] Using face_data.face_detail as fallback');
             setFaceAttributes(faceResult.data.face_data.face_detail);
           }
           
           console.log('[Dashboard] Updated face data processed');
        } else {
           console.log('[Dashboard] Failed to refetch face data:', faceResult.error);
        }
      }
      fetchUserDataAgain();
    }, 1000);
  };

  const renderFaceAttributes = () => {
    if (!faceAttributes) {
      return _jsx("div", {
        className:
          "mt-4 bg-white p-5 rounded-apple-xl border border-apple-gray-200 shadow-sm",
        children: _jsx("p", {
          className: "text-apple-gray-600",
          children:
            "Face analysis data is not available. This might be loading or registration didn't capture details.",
        }),
      });
    }

    console.groupCollapsed('🎭 [Dashboard] Rendering Face attributes data:');
    console.log(JSON.stringify(faceAttributes, null, 2));
    console.groupEnd();

    // Extract data from DynamoDB S-format if needed
    const extractS = (obj) => {
      if (!obj) return obj;
      if (obj && obj.S !== undefined) return obj.S;
      return obj;
    };

    // Parse FaceAttributes from different possible response formats
    let faceDetail = null;
    
    // First check for string format in face_attributes that needs parsing
    if (typeof faceAttributes === 'string') {
      console.log('[Dashboard] Found face_attributes as direct string, attempting to parse');
      try {
        faceDetail = JSON.parse(faceAttributes);
      } catch (e) {
        console.error('[Dashboard] Error parsing direct string face_attributes:', e);
      }
    } 
    // Special case: if we have raw face_attributes field as null, try to build from other fields
    else if (faceAttributes.face_attributes === null) {
      console.log('[Dashboard] face_attributes field is null, checking for other formats');
      
      // Try to find attributes in face_data nested structure that sometimes comes with the 400 error
      if (faceAttributes.face_data && faceAttributes.face_data.face_detail) {
        console.log('[Dashboard] Found face_data.face_detail structure');
        faceDetail = faceAttributes.face_data.face_detail;
      }
    }
    // Now proceed with normal format determination
    else if (faceAttributes.FaceAttributes) {
      // Direct Rekognition response format
      faceDetail = faceAttributes.FaceAttributes;
    } else if (faceAttributes.FaceDetail) {
      // Nested FaceDetail format
      faceDetail = faceAttributes.FaceDetail;
    } else if (faceAttributes.face_attributes) {
      // DynamoDB format with face_attributes property
      // This might be a string (needs parsing) or an object
      if (typeof faceAttributes.face_attributes === 'string') {
        try {
          console.log('[Dashboard] Parsing string face_attributes');
          faceDetail = JSON.parse(faceAttributes.face_attributes);
          console.log('[Dashboard] Successfully parsed face_attributes string');
        } catch (e) {
          console.error('[Dashboard] Error parsing face_attributes string:', e);
          faceDetail = { error: 'Unable to parse face attributes' };
        }
      } else {
        console.log('[Dashboard] Using face_attributes as object directly');
        faceDetail = faceAttributes.face_attributes;
      }
    } else if (faceAttributes.AgeRange || faceAttributes.Gender || faceAttributes.Emotions) {
      // Direct attribute format - already contains the attributes at the top level
      console.log('[Dashboard] Found direct top-level attributes');
      faceDetail = faceAttributes;
    } else {
      // Unknown format, just use what we have
      console.log('[Dashboard] Using unknown format face attributes directly');
      faceDetail = faceAttributes;
    }
    
    // Additional logging for debugging
    console.groupCollapsed('🔍 [Dashboard] Extracted face detail structure:');
    console.log({
      hasAgeRange: !!faceDetail?.AgeRange,
      hasGender: !!faceDetail?.Gender,
      hasEmotions: !!(faceDetail?.Emotions && Array.isArray(faceDetail.Emotions)),
      hasBeard: !!faceDetail?.Beard,
      structure: Object.keys(faceDetail || {})
    });
    console.groupEnd();

    // Parse Emotions from different possible attribute structures
    let emotions = [];
    if (faceDetail.Emotions && Array.isArray(faceDetail.Emotions)) {
      emotions = faceDetail.Emotions;
    } else if (faceDetail.emotions && Array.isArray(faceDetail.emotions)) {
      emotions = faceDetail.emotions;
    } else {
      // Try to find any array property that might contain emotions
      Object.keys(faceDetail).forEach(key => {
        if (Array.isArray(faceDetail[key]) && 
            faceDetail[key].length > 0 && 
            faceDetail[key][0] && 
            (faceDetail[key][0].Type || faceDetail[key][0].type) && 
            (faceDetail[key][0].Confidence || faceDetail[key][0].confidence)) {
          emotions = faceDetail[key];
        }
      });
    }

    const primaryEmotion =
      emotions.length > 0
        ? emotions.reduce(
            (prev, curr) => {
              // Handle different attribute naming formats
              const prevConfidence = extractS(prev.Confidence) || extractS(prev.confidence) || 0;
              const currConfidence = extractS(curr.Confidence) || extractS(curr.confidence) || 0;
              return prevConfidence > currConfidence ? prev : curr;
            },
            { Confidence: 0, Type: "Unknown" },
          )
        : null;

    // Helper function to get attribute values with multiple structure support
    const getAttributeValue = (attrName) => {
      const lowerName = attrName.toLowerCase();
      
      // Format 1: direct properties with Value
      if (faceDetail[attrName]?.Value !== undefined) {
        return extractS(faceDetail[attrName].Value);
      }
      
      // Format 2: lowercase properties with value
      if (faceDetail[attrName]?.value !== undefined) {
        return extractS(faceDetail[attrName].value);
      }
      
      // Format 3: lowercase name with Value
      if (faceDetail[lowerName]?.Value !== undefined) {
        return extractS(faceDetail[lowerName].Value);
      }
      
      // Format 4: lowercase name with value
      if (faceDetail[lowerName]?.value !== undefined) {
        return extractS(faceDetail[lowerName].value);
      }
      
      // Format 5: direct boolean on the object
      if (typeof faceDetail[attrName] === 'boolean') {
        return faceDetail[attrName];
      }
      
      // Format 6: direct boolean on lowercase name
      if (typeof faceDetail[lowerName] === 'boolean') {
        return faceDetail[lowerName];
      }
      
      return undefined;
    };

    // Create attribute cards for the dashboard
    const attributeCards = [];

    // Add Gender card if available
    const gender = getAttributeValue('Gender') || 
                  faceDetail.gender?.Value || 
                  faceDetail.gender?.value ||
                  (faceDetail.Gender && typeof faceDetail.Gender === 'string' ? faceDetail.Gender : null);
                  
    if (gender) {
      attributeCards.push({
        icon: _jsx(User, { className: "w-5 h-5 text-blue-500" }),
        title: "Gender",
        value: typeof gender === 'string' ? gender.toLowerCase() : 'Unknown',
        color: "text-blue-600",
      });
    }

    // Add Age Range card if available
    const ageRange = faceDetail.AgeRange || faceDetail.ageRange;
    if (ageRange) {
      const low = extractS(ageRange.Low || ageRange.low);
      const high = extractS(ageRange.High || ageRange.high);
      if (low && high) {
        attributeCards.push({
          icon: _jsx(Calendar, { className: "w-5 h-5 text-purple-500" }),
          title: "Age Range",
          value: `${low}-${high} years`,
          color: "text-purple-600",
        });
      }
    }

    // Add Smile card if available
    const smile = getAttributeValue('Smile');
    if (smile !== undefined) {
      attributeCards.push({
        icon: _jsx(Smile, { className: "w-5 h-5 text-pink-500" }),
        title: "Smile",
        value: smile ? "Yes" : "No",
        color: smile ? "text-pink-600" : "text-gray-600",
      });
    }

    // Add Eyes Open card if available
    const eyesOpen = getAttributeValue('EyesOpen');
    if (eyesOpen !== undefined) {
      attributeCards.push({
        icon: _jsx(Eye, { className: "w-5 h-5 text-teal-500" }),
        title: "Eyes Open",
        value: eyesOpen ? "Yes" : "No",
        color: eyesOpen ? "text-teal-600" : "text-gray-600",
      });
    }

    // Add Beard and Mustache card if available
    const beard = getAttributeValue('Beard');
    const mustache = getAttributeValue('Mustache');
    if (beard || mustache) {
      let facialHair = [];
      if (beard) facialHair.push("Beard");
      if (mustache) facialHair.push("Mustache");
      attributeCards.push({
        icon: _jsx(Scissors, { className: "w-5 h-5 text-amber-500" }),
        title: "Facial Hair",
        value: facialHair.join(" & ") || "None",
        color: "text-amber-600",
      });
    }

    // Add Emotion card if available
    if (primaryEmotion && (primaryEmotion.Type || primaryEmotion.type)) {
      const emotionType = extractS(primaryEmotion.Type) || extractS(primaryEmotion.type) || "Unknown";
      attributeCards.push({
        icon: _jsx(Heart, { className: "w-5 h-5 text-red-500" }),
        title: "Emotion",
        value: emotionType,
        color: "text-red-600",
      });
    }

    // Add Eyewear card if available
    const eyeglasses = getAttributeValue('Eyeglasses');
    const sunglasses = getAttributeValue('Sunglasses');
    if (eyeglasses || sunglasses) {
      attributeCards.push({
        icon: _jsx(Glasses, { className: "w-5 h-5 text-indigo-500" }),
        title: "Eyewear",
        value: sunglasses ? "Sunglasses" : "Eyeglasses",
        color: "text-indigo-600",
      });
    }

    if (attributeCards.length === 0) {
      return _jsxs("div", {
        className:
          "mt-4 bg-white p-5 rounded-apple-xl border border-apple-gray-200 shadow-sm",
        children: [
           _jsx("h4", { className: "text-lg font-medium text-apple-gray-900 mb-3 flex items-center", children: "Face Analysis" }),
           _jsx("p", { className: "text-apple-gray-600", children: "Detailed face analysis is not available yet. Complete face registration to see attributes." }),
         ],
       });
    }

    return _jsxs("div", {
      className:
        "mt-4 bg-white p-5 rounded-apple-xl border border-apple-gray-200 shadow-sm",
      children: [
        _jsx("h4", {
          className:
            "text-lg font-medium text-apple-gray-900 mb-3 flex items-center",
          children: _jsxs("span", {
            className: "flex items-center",
            children: [
              _jsx(User, { className: "w-5 h-5 mr-2 text-blue-500" }),
              "Face Analysis",
            ],
          }),
        }),
        _jsx("div", {
          className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3",
          children: attributeCards.map((card, index) =>
            _jsxs("div", {
              key: index,
              className:
                "bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col items-center text-center cursor-pointer hover:scale-105 transform transition-transform",
              children: [
                _jsx("div", {
                  className: "mb-2",
                  children: card.icon,
                }),
                _jsx("h3", {
                  className: "text-sm font-medium text-gray-700 mb-1",
                  children: card.title,
                }),
                _jsx("p", {
                  className: `text-base font-semibold ${card.color}`,
                  children: card.value,
                }),
              ],
            }),
          ),
        }),
      ],
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "upload":
        return _jsxs("div", {
          className:
            "bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100",
          children: [
            _jsx("div", {
              className: "flex items-center mb-6",
              children: _jsxs("h2", {
                className:
                  "text-xl font-semibold text-apple-gray-900 flex items-center",
                children: [
                  _jsx(Upload, {
                    className: "w-5 h-5 mr-2 text-apple-blue-500",
                  }),
                  "Upload Photos",
                ],
              }),
            }),
            _jsx("p", {
              className:
                "text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple",
              children:
                "Upload photos to be indexed for facial recognition. Other users will be able to find photos they appear in.",
            }),
            _jsx(PhotoManager, { mode: "upload" }),
          ],
        });
      case "photos":
        return _jsxs("div", {
          className:
            "bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100",
          children: [
            _jsx("div", {
              className: "flex items-center justify-between mb-6",
              children: _jsxs("h2", {
                className:
                  "text-xl font-semibold text-apple-gray-900 flex items-center",
                children: [
                  _jsx(Photos, {
                    className: "w-5 h-5 mr-2 text-apple-blue-500",
                  }),
                  "My Photos",
                ],
              }),
            }),
            _jsx("p", {
              className:
                "text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple",
              children:
                "Photos where you have been identified through facial recognition.",
            }),
            _jsx(PhotoManager, { mode: "matches" }),
          ],
        });
      case "events":
        return _jsxs("div", {
          className:
            "bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100",
          children: [
            _jsx("div", {
              className: "flex items-center justify-between mb-6",
              children: _jsxs("h2", {
                className:
                  "text-xl font-semibold text-apple-gray-900 flex items-center",
                children: [
                  _jsx(Calendar, {
                    className: "w-5 h-5 mr-2 text-apple-blue-500",
                  }),
                  "Events",
                ],
              }),
            }),
            _jsx("p", {
              className: "text-apple-gray-500",
              children: "No events found.",
            }),
          ],
        });
      case "admin":
        return _jsxs("div", {
          className:
            "bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100",
          children: [
            _jsx("div", {
              className: "flex items-center justify-between mb-6",
              children: _jsxs("h2", {
                className:
                  "text-xl font-semibold text-apple-gray-900 flex items-center",
                children: [
                  _jsx(Settings, {
                    className: "w-5 h-5 mr-2 text-apple-blue-500",
                  }),
                  "Admin Area",
                ],
              }),
            }),
            _jsx("p", {
              className:
                "text-apple-gray-600 mb-6 border-l-4 border-apple-gray-500 pl-4 py-2 bg-apple-gray-50 rounded-r-apple",
              children:
                "Admin tools are currently unavailable. Management is performed via the AWS Console.",
            }),
          ],
        });
      default:
        return _jsxs(_Fragment, {
          children: [
            _jsxs(motion.div, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5 },
              className:
                "lg:col-span-2 bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100",
              children: [
                _jsxs("div", {
                  className: "flex items-center mb-6",
                  children: [
                    _jsx("div", {
                      className:
                        "w-12 h-12 rounded-full bg-apple-blue-100 text-apple-blue-700 flex items-center justify-center mr-4 text-xl font-semibold",
                      children: (
                        user?.full_name?.charAt(0) ||
                        user?.email?.charAt(0) ||
                        "U"
                      ).toUpperCase(),
                    }),
                    _jsxs("div", {
                      children: [
                        _jsxs("h1", {
                          className:
                            "text-2xl font-semibold text-apple-gray-900",
                          children: [
                            "Welcome back",
                            user?.full_name
                              ? `, ${user.full_name}`
                              : "",
                          ],
                        }),
                        _jsx("p", {
                          className: "text-apple-gray-500",
                          children: faceRegistered
                            ? "Your face is registered"
                            : "Complete your profile by registering your face",
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx("p", {
                  className:
                    "text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple",
                  children: faceRegistered
                    ? "Your face has been registered. You can now use the facial recognition feature for quick authentication."
                    : "Get started by registering your face to enable quick authentication and find your photos at events.",
                }),
                _jsxs("div", {
                  className: "mb-6",
                  children: [
                    _jsx("h3", {
                      className:
                        "text-xl font-semibold text-apple-gray-900 mb-3 flex items-center",
                      children: _jsxs("span", {
                        className: "flex items-center",
                        children: [
                          _jsx(Camera, { className: "w-5 h-5 mr-2 text-purple-500" }),
                          "Your Identity",
                        ],
                      }),
                    }),
                    faceImageUrl ? (
                      _jsxs("div", {
                        className: "flex flex-col md:flex-row gap-6 bg-white p-6 rounded-apple-xl border border-apple-gray-200 shadow-sm",
                        children: [
                          _jsxs("div", {
                            className: "flex flex-col items-center",
                            children: [
                              _jsx("div", {
                                className:
                                  "relative w-full max-w-xs aspect-square rounded-apple-xl overflow-hidden border border-apple-gray-200 shadow-md",
                                children: _jsx("img", {
                                  src: faceImageUrl,
                                  alt: "Registered face",
                                  className: "w-full h-full object-cover",
                                }),
                              }),
                              _jsx("p", {
                                className: "mt-3 text-apple-gray-600 text-sm",
                                children: "This is your registered face image used for recognition"
                              })
                            ],
                          }),
                          _jsx("div", {
                            className: "flex-1 md:ml-6",
                            children: renderFaceAttributes(),
                          }),
                        ],
                      })
                    ) : (
                      _jsx("div", {
                        className: "bg-white p-6 rounded-apple-xl border border-apple-gray-200 shadow-sm text-center",
                        children: _jsxs("div", {
                          className: "flex flex-col items-center gap-4",
                          children: [
                            _jsx(Camera, { className: "w-12 h-12 text-apple-gray-400" }),
                            _jsx("p", {
                              className: "text-apple-gray-600",
                              children: "No face image has been registered yet. Complete the face registration process to see your identity."
                            }),
                            _jsx("button", {
                              onClick: () => setShowRegistrationModal(true),
                              className: "px-4 py-2 bg-apple-blue-500 text-white rounded-apple font-medium hover:bg-apple-blue-600 transition-colors",
                              children: "Register Face"
                            })
                          ]
                        })
                      })
                    )
                  ],
                }),
                _jsxs("button", {
                  onClick: () => setShowRegistrationModal(true),
                  className: "ios-button-primary flex items-center",
                  children: [
                    _jsx(Camera, { className: "w-5 h-5 mr-2" }),
                    faceRegistered ? "Re-Register Face" : "Register Your Face",
                  ],
                }),
              ],
            }),
            _jsxs(motion.div, {
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, delay: 0.1 },
              className:
                "bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100",
              children: [
                _jsxs("h2", {
                  className:
                    "text-lg font-medium text-apple-gray-900 mb-6 flex items-center",
                  children: [
                    _jsx(Shield, {
                      className: "w-5 h-5 mr-2 text-apple-blue-500",
                    }),
                    "Face Recognition Status",
                  ],
                }),
                _jsxs("div", {
                  className:
                    "flex items-center p-4 bg-apple-gray-50 rounded-apple mb-4 border border-apple-gray-200",
                  children: [
                    _jsx("div", {
                      className: `w-3 h-3 rounded-full mr-3 ${faceRegistered ? "bg-apple-green-500" : "bg-amber-500"}`,
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx("span", {
                          className: "text-sm font-medium text-apple-gray-900",
                          children: faceRegistered
                            ? "Registered"
                            : "Not Registered",
                        }),
                        _jsx("p", {
                          className: "text-xs text-apple-gray-500 mt-1",
                          children: faceRegistered
                            ? "Last updated: Today"
                            : "Register to enhance security",
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "mt-6",
                  children: [
                    _jsx("h3", {
                      className: "text-sm font-medium text-apple-gray-900 mb-2",
                      children: "Privacy information",
                    }),
                    _jsxs("div", {
                      className: "flex items-start text-xs text-apple-gray-600",
                      children: [
                        _jsx(AlertCircle, {
                          className:
                            "w-4 h-4 mr-2 text-apple-gray-400 flex-shrink-0 mt-0.5",
                        }),
                        _jsx("p", {
                          children:
                            "Your face data is encrypted and stored securely. We never share your biometric data with third parties.",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
    }
  };

  const navigationTabs = [
    { id: "home", name: "Home", icon: _jsx(Camera, { className: "w-4 h-4" }) },
    {
      id: "upload",
      name: "Upload",
      icon: _jsx(Upload, { className: "w-4 h-4" }),
    },
    {
      id: "photos",
      name: "My Photos",
      icon: _jsx(Image, { className: "w-4 h-4" }),
    },
    {
      id: "events",
      name: "Events",
      icon: _jsx(Calendar, { className: "w-4 h-4" }),
    },
    {
      id: "admin",
      name: "Admin",
      icon: _jsx(Shield, { className: "w-4 h-4" }),
    },
  ];

  const renderNavigationButtons = () => {
    const visibleTabs = navigationTabs.filter((tab) => {
      if (tab.id === "admin") {
        return isAdmin;
      }
      return true;
    });

    return visibleTabs.map((tab) => {
      const { id, onClick, icon, name } = tab;
      return _jsxs("button", {
        key: id,
        onClick: onClick || (() => setActiveTab(id)),
        className: cn(
          "flex items-center px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-300",
          activeTab === id
            ? "bg-white text-apple-gray-900 shadow-apple-button"
            : "text-apple-gray-600 hover:text-apple-gray-900",
        ),
        children: [icon, _jsx("span", { className: "ml-2", children: name })],
      });
    });
  };

  return _jsxs("div", {
    className: "min-h-screen bg-apple-gray-50 font-sans",
    children: [
      _jsx("header", {
        className: "backdrop-navbar sticky top-0 z-40 pt-ios-safe",
        children: _jsx("div", {
          className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
          children: _jsxs("div", {
            className: "flex justify-between h-16 items-center",
            children: [
              _jsx("div", {
                className: "font-bold text-xl",
                children: _jsx("img", {
                  src: "https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png",
                  alt: "SHMONG.tv",
                  className: "h-8",
                }),
              }),
              _jsxs("div", {
                className: "relative",
                children: [
                  _jsxs("button", {
                    onClick: () => setIsMenuOpen(!isMenuOpen),
                    className:
                      "flex items-center space-x-2 text-sm text-apple-gray-700 bg-apple-gray-100 px-3 py-2 rounded-apple hover:bg-apple-gray-200 transition-all duration-300",
                    children: [
                      _jsx("div", {
                        className:
                          "w-8 h-8 rounded-full bg-apple-blue-100 text-apple-blue-700 flex items-center justify-center",
                        children: user?.email?.charAt(0).toUpperCase(),
                      }),
                      _jsx("span", {
                        className: "hidden md:inline font-medium",
                        children: user?.email,
                      }),
                      _jsx(ChevronDown, {
                        className: "h-4 w-4 text-apple-gray-500",
                      }),
                    ],
                  }),
                  isMenuOpen &&
                    _jsxs(motion.div, {
                      initial: { opacity: 0, y: 10 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.2 },
                      className:
                        "absolute right-0 mt-2 w-56 bg-white rounded-apple-xl shadow-apple-lg py-2 z-10 border border-apple-gray-100",
                      children: [
                        _jsxs("div", {
                          className: "px-4 py-2 border-b border-apple-gray-100",
                          children: [
                            _jsx("p", {
                              className:
                                "text-sm font-medium text-apple-gray-900",
                              children: user?.full_name || "User",
                            }),
                            _jsx("p", {
                              className: "text-xs text-apple-gray-500 truncate",
                              children: user?.email,
                            }),
                          ],
                        }),
                        _jsx("div", {
                          className: "py-1",
                          children: _jsxs(motion.div, {
                            className: "space-y-1 px-2",
                            children: [
                              _jsx("button", {
                                onClick: () => setActiveTab("profile"),
                                className:
                                  "flex w-full items-center px-2 py-2 text-sm text-apple-gray-700 rounded-apple hover:bg-apple-gray-100",
                                children: _jsxs("div", {
                                  className: "flex items-center",
                                  children: [
                                    _jsx(User, {
                                      className:
                                        "mr-2 h-4 w-4 text-apple-gray-500",
                                    }),
                                    "Profile",
                                  ],
                                }),
                              }),
                              _jsx("button", {
                                onClick: () => setActiveTab("settings"),
                                className:
                                  "flex w-full items-center px-2 py-2 text-sm text-apple-gray-700 rounded-apple hover:bg-apple-gray-100",
                                children: _jsxs("div", {
                                  className: "flex items-center",
                                  children: [
                                    _jsx(Settings, {
                                      className:
                                        "mr-2 h-4 w-4 text-apple-gray-500",
                                    }),
                                    "Settings",
                                  ],
                                }),
                              }),
                              _jsx("button", {
                                onClick: () => setActiveTab("admin"),
                                className:
                                  "flex w-full items-center px-2 py-2 text-sm text-apple-gray-700 rounded-apple hover:bg-apple-gray-100",
                                children: _jsxs("div", {
                                  className: "flex items-center",
                                  children: [
                                    _jsx(Shield, {
                                      className:
                                        "mr-2 h-4 w-4 text-apple-gray-500",
                                    }),
                                    "Admin Tools",
                                  ],
                                }),
                              }),
                              _jsx("div", {
                                className:
                                  "border-t border-apple-gray-100 my-2",
                              }),
                              _jsx("button", {
                                onClick: async () => {
                                  await signOut();
                                  setIsMenuOpen(false);
                                },
                                className:
                                  "flex w-full items-center px-2 py-2 text-sm text-apple-gray-700 rounded-apple hover:bg-apple-gray-100",
                                children: _jsxs("div", {
                                  className: "flex items-center",
                                  children: [
                                    _jsx(LogOut, {
                                      className:
                                        "mr-2 h-4 w-4 text-apple-gray-500",
                                    }),
                                    "Sign out",
                                  ],
                                }),
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                ],
              }),
            ],
          }),
        }),
      }),
      _jsxs("main", {
        className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-ios-safe",
        children: [
          _jsx("div", {
            className: "flex overflow-x-auto mb-8 pb-2 no-scrollbar",
            children: _jsx("nav", {
              className:
                "flex space-x-2 mx-auto bg-apple-gray-200 p-1 rounded-full",
              children: renderNavigationButtons(),
            }),
          }),
          _jsx("div", {
            className: cn(
              "grid gap-8",
              activeTab === "home"
                ? "grid-cols-1 lg:grid-cols-3"
                : "grid-cols-1",
            ),
            children: renderContent(),
          }),
        ],
      }),
      _jsx(AnimatePresence, {
        children:
          showRegistrationModal &&
          _jsx(FaceRegistration, {
            onSuccess: handleRegistrationSuccess,
            onClose: () => setShowRegistrationModal(false),
          }),
      }),
      _jsx(DebugToolbar, {}),
    ],
  });
};

export default Dashboard;
