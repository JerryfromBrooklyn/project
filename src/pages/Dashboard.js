import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-runtime";
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
import { PhotoManager } from "../components/PhotoManager";
import AdminTools from "../components/AdminTools.jsx";
import { supabase } from "../lib/supabaseClient";
import { toast } from "react-hot-toast";

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [faceRegistered, setFaceRegistered] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [faceImageUrl, setFaceImageUrl] = useState(null);
  const [faceAttributes, setFaceAttributes] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [faceData, setFaceData] = useState(null);

  useEffect(() => {
    const fetchFaceData = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('user_face_data') 
          .select('face_id, created_at, updated_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setFaceData({ 
            face_id: data.face_id,
            created_at: data.created_at,
            updated_at: data.updated_at,
            attributes: { message: 'Attributes not stored in this table' }
          }); 
        } else {
          setFaceData(null);
        }
      } catch (err) {
        console.error('Error fetching face data:', err);
        setFaceData(null);
      }
    };

    fetchFaceData();
  }, [user]);

  // Check if user is admin
  useEffect(() => {
    if (!user) return;

    const checkAdminStatus = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profileError && profile && profile.role === "admin") {
          setIsAdmin(true);
          return;
        }

        // Check in admins table as fallback
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!adminError && adminData) {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
      }
    };

    checkAdminStatus();
  }, [user]);

  const handleRegistrationSuccess = (faceId, attributes) => {
    console.log('[Dashboard] Registration successful. Face ID:', faceId);
    setFaceRegistered(true);
    if (attributes) {
        setFaceAttributes(attributes);
    }
    
    fetchFaceData(); 
    
    setTimeout(() => {
        setShowRegistrationModal(false);
    }, 1500);
    
    toast({
        title: 'Face Registration Complete',
        description: 'Your face has been successfully registered.',
        status: 'success',
        duration: 5000,
        isClosable: true,
    });
  };

  const renderFaceAttributes = () => {
    if (!faceAttributes) {
      return _jsx("div", {
        className:
          "mt-4 bg-white p-5 rounded-apple-xl border border-apple-gray-200 shadow-sm",
        children: _jsx("p", {
          className: "text-apple-gray-600",
          children:
            "Face analysis data is not available for this image. Try re-registering your face to get detailed insights.",
        }),
      });
    }

    // Log the face attributes to help debug
    console.log(
      "Face attributes data:",
      JSON.stringify(faceAttributes, null, 2),
    );

    // Determine the primary emotion (with the highest confidence)
    // Handle both PascalCase (Emotions) and camelCase (emotions) formats
    const emotions = faceAttributes.Emotions || faceAttributes.emotions || [];
    const primaryEmotion =
      emotions.length > 0
        ? emotions.reduce(
            (prev, curr) => {
              const prevConf = prev.Confidence || prev.confidence || 0;
              const currConf = curr.Confidence || curr.confidence || 0;
              return prevConf > currConf ? prev : curr;
            },
            { Confidence: 0, Type: "Unknown" },
          )
        : null;

    // Get attribute values, handling both PascalCase and camelCase formats
    const getAttrValue = (pascalCase, camelCase) => {
      if (faceAttributes[pascalCase] !== undefined) {
        return faceAttributes[pascalCase].Value !== undefined
          ? faceAttributes[pascalCase].Value
          : faceAttributes[pascalCase];
      }
      if (faceAttributes[camelCase] !== undefined) {
        return faceAttributes[camelCase].value !== undefined
          ? faceAttributes[camelCase].value
          : faceAttributes[camelCase];
      }
      return undefined;
    };

    const getAttrConfidence = (pascalCase, camelCase) => {
      if (
        faceAttributes[pascalCase] !== undefined &&
        faceAttributes[pascalCase].Confidence !== undefined
      ) {
        return faceAttributes[pascalCase].Confidence;
      }
      if (
        faceAttributes[camelCase] !== undefined &&
        faceAttributes[camelCase].confidence !== undefined
      ) {
        return faceAttributes[camelCase].confidence;
      }
      return 0;
    };

    // Get age values
    const ageRange = faceAttributes.AgeRange || faceAttributes.age || {};
    const lowAge = ageRange.Low || ageRange.low || 0;
    const highAge = ageRange.High || ageRange.high || 0;

    // Create attribute cards for each facial feature
    const attributeCards = [];

    // Gender info
    const gender = getAttrValue("Gender", "gender");
    if (gender) {
      attributeCards.push({
        icon: _jsx(User, { className: "w-5 h-5 text-blue-500" }),
        title: "Identity",
        value: gender.toLowerCase(),
        color: "text-blue-600",
      });
    }

    // Age range info
    if (lowAge > 0 || highAge > 0) {
      attributeCards.push({
        icon: _jsx(Calendar, { className: "w-5 h-5 text-purple-500" }),
        title: "Age Range",
        value: `${lowAge}-${highAge} years`,
        color: "text-purple-600",
      });
    }

    // Smile detection
    const hasSmile = getAttrValue("Smile", "smile");
    if (hasSmile !== undefined) {
      attributeCards.push({
        icon: _jsx(Smile, { className: "w-5 h-5 text-pink-500" }),
        title: "Smile",
        value: hasSmile ? "Yes" : "No",
        color: hasSmile ? "text-pink-600" : "text-gray-600",
      });
    }

    // Eyes info
    const eyesOpen = getAttrValue("EyesOpen", "eyesOpen");
    if (eyesOpen !== undefined) {
      attributeCards.push({
        icon: _jsx(Eye, { className: "w-5 h-5 text-teal-500" }),
        title: "Eyes",
        value: eyesOpen ? "Open" : "Closed",
        color: eyesOpen ? "text-teal-600" : "text-gray-600",
      });
    }

    // Facial hair info
    const hasBeard = getAttrValue("Beard", "beard");
    const hasMustache = getAttrValue("Mustache", "mustache");

    if (hasBeard || hasMustache) {
      let facialHair = [];
      if (hasBeard) facialHair.push("Beard");
      if (hasMustache) facialHair.push("Mustache");

      attributeCards.push({
        icon: _jsx(Scissors, { className: "w-5 h-5 text-amber-500" }),
        title: "Facial Hair",
        value: facialHair.join(" & "),
        color: "text-amber-600",
      });
    }

    // Eyewear info
    const hasEyeglasses = getAttrValue("Eyeglasses", "eyeglasses");
    const hasSunglasses = getAttrValue("Sunglasses", "sunglasses");

    if (hasEyeglasses || hasSunglasses) {
      attributeCards.push({
        icon: _jsx(Glasses, { className: "w-5 h-5 text-indigo-500" }),
        title: "Eyewear",
        value: hasSunglasses ? "Sunglasses" : "Glasses",
        color: "text-indigo-600",
      });
    }

    // Emotion
    if (primaryEmotion) {
      const emotionType = primaryEmotion.Type || primaryEmotion.type;
      if (emotionType && emotionType !== "Unknown") {
        const emotionColor =
          {
            HAPPY: "text-yellow-600",
            CALM: "text-teal-600",
            SAD: "text-blue-600",
            CONFUSED: "text-purple-600",
            DISGUSTED: "text-green-600",
            SURPRISED: "text-pink-600",
            ANGRY: "text-red-600",
            FEAR: "text-indigo-600",
          }[emotionType] || "text-gray-600";

        attributeCards.push({
          icon: _jsx(Heart, { className: "w-5 h-5 text-red-500" }),
          title: "Emotion",
          value: emotionType.toLowerCase(),
          color: emotionColor,
        });
      }
    }

    // Image quality info
    const quality = faceAttributes.Quality;
    if (quality) {
      const brightness = quality.Brightness || 0;
      const sharpness = quality.Sharpness || 0;
      const clarity = Math.round((brightness + sharpness) / 2);

      const qualityLabel =
        clarity > 70 ? "Excellent" : clarity > 50 ? "Good" : "Fair";
      const qualityColor =
        clarity > 70
          ? "text-green-600"
          : clarity > 50
            ? "text-amber-600"
            : "text-orange-600";

      attributeCards.push({
        icon: _jsx(Zap, { className: "w-5 h-5 text-yellow-500" }),
        title: "Image Quality",
        value: `${qualityLabel} (${clarity}%)`,
        color: qualityColor,
      });
    }

    // If we have no attributes, show a fallback
    if (attributeCards.length === 0) {
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
          _jsx("p", {
            className: "text-apple-gray-600",
            children:
              "Your face has been registered successfully, but no detailed attributes were detected. Try re-registering in good lighting with a clear view of your face.",
          }),
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
                  "Admin Tools",
                ],
              }),
            }),
            _jsx("p", {
              className:
                "text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple",
              children:
                "Advanced tools for administrators to manage system settings and repair functionality.",
            }),
            _jsx(AdminTools, {}),
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
                        user?.user_metadata?.full_name?.charAt(0) ||
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
                            user?.user_metadata?.full_name
                              ? `, ${user.user_metadata.full_name}`
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
                faceImageUrl &&
                  _jsxs("div", {
                    className: "mb-6",
                    children: [
                      _jsx("h3", {
                        className:
                          "text-sm font-medium text-apple-gray-700 mb-2",
                        children: "Your Registered Face",
                      }),
                      _jsxs("div", {
                        className: "flex flex-col md:flex-row gap-6",
                        children: [
                          _jsx("div", {
                            className:
                              "relative w-full max-w-xs aspect-square rounded-apple-xl overflow-hidden border border-apple-gray-200",
                            children: _jsx("img", {
                              src: faceImageUrl,
                              alt: "Registered face",
                              className: "w-full h-full object-contain",
                            }),
                          }),
                          renderFaceAttributes(),
                        ],
                      }),
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

  // Define the navigation tabs array outside the JSX
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
    {
      id: "emergency",
      name: "Emergency Tools",
      icon: _jsx(AlertTriangle, { className: "w-4 h-4 text-amber-500" }),
      onClick: () => {
        window.location.href = "/emergency-tools";
      },
    },
  ];

  // Create the navigation buttons
  const renderNavigationButtons = () => {
    const visibleTabs = navigationTabs.filter((tab) => {
      if (tab.id === "admin" || tab.id === "emergency") {
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
                              children:
                                user?.user_metadata?.full_name || "User",
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
                              isAdmin
                                ? _jsx("button", {
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
                                  })
                                : null,
                              isAdmin
                                ? _jsx("button", {
                                    onClick: () => {
                                      window.location.href = "/emergency-tools";
                                      setIsMenuOpen(false);
                                    },
                                    className:
                                      "flex w-full items-center px-2 py-2 text-sm text-amber-600 rounded-apple hover:bg-amber-50",
                                    children: _jsxs("div", {
                                      className: "flex items-center",
                                      children: [
                                        _jsx(AlertTriangle, {
                                          className:
                                            "mr-2 h-4 w-4 text-amber-500",
                                        }),
                                        "Emergency Tools",
                                      ],
                                    }),
                                  })
                                : null,
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
            onClose: () => setShowRegistrationModal(false),
            onSuccess: handleRegistrationSuccess,
          }),
      }),
    ],
  });
};

export default Dashboard;
