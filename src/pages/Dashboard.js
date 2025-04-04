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
            setFaceAttributes(faceResult.data.face_detail || null);
            setFaceImageUrl(faceResult.data.public_url || null);
            console.log('[Dashboard] Face data found:', faceResult.data);
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

  const handleRegistrationSuccess = () => {
    setFaceRegistered(true);
    setShowRegistrationModal(false);
    console.log('[Dashboard] Face registered, attempting to refetch user data...');
    setTimeout(() => {
        const fetchUserDataAgain = async () => {
          if (!user || !user.id) return;
          const faceResult = await getFaceData(user.id);
          if (faceResult.success && faceResult.data) {
             setFaceRegistered(true);
             setFaceAttributes(faceResult.data.face_detail || null);
             setFaceImageUrl(faceResult.data.public_url || null);
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

    console.log(
      "[Dashboard] Rendering Face attributes data:",
      JSON.stringify(faceAttributes, null, 2),
    );

    const emotions = faceAttributes.Emotions || [];
    const primaryEmotion =
      emotions.length > 0
        ? emotions.reduce(
            (prev, curr) => {
              return (prev.Confidence || 0) > (curr.Confidence || 0) ? prev : curr;
            },
            { Confidence: 0, Type: "Unknown" },
          )
        : null;

    const getRecoValue = (attrName) => {
        return faceAttributes[attrName]?.Value;
    }
    const getRecoConfidence = (attrName) => {
        return faceAttributes[attrName]?.Confidence || 0;
    }

    const attributeCards = [];

    const gender = faceAttributes.Gender;
    if (gender?.Value) {
      attributeCards.push({
        icon: _jsx(User, { className: "w-5 h-5 text-blue-500" }),
        title: "Gender",
        value: gender.Value.toLowerCase(),
        color: "text-blue-600",
      });
    }

    const ageRange = faceAttributes.AgeRange;
    if (ageRange?.Low && ageRange?.High) {
      attributeCards.push({
        icon: _jsx(Calendar, { className: "w-5 h-5 text-purple-500" }),
        title: "Age Range",
        value: `${ageRange.Low}-${ageRange.High} years`,
        color: "text-purple-600",
      });
    }

    const smile = faceAttributes.Smile;
    if (smile !== undefined) {
      attributeCards.push({
        icon: _jsx(Smile, { className: "w-5 h-5 text-pink-500" }),
        title: "Smile",
        value: smile.Value ? "Yes" : "No",
        color: smile.Value ? "text-pink-600" : "text-gray-600",
      });
    }

    const eyesOpen = faceAttributes.EyesOpen;
    if (eyesOpen !== undefined) {
      attributeCards.push({
        icon: _jsx(Eye, { className: "w-5 h-5 text-teal-500" }),
        title: "Eyes Open",
        value: eyesOpen.Value ? "Yes" : "No",
        color: eyesOpen.Value ? "text-teal-600" : "text-gray-600",
      });
    }

    const beard = faceAttributes.Beard;
    const mustache = faceAttributes.Mustache;
    if (beard?.Value || mustache?.Value) {
      let facialHair = [];
      if (beard?.Value) facialHair.push("Beard");
      if (mustache?.Value) facialHair.push("Mustache");
      attributeCards.push({
        icon: _jsx(Scissors, { className: "w-5 h-5 text-amber-500" }),
        title: "Facial Hair",
        value: facialHair.join(" & "),
        color: "text-amber-600",
      });
    }

    const eyeglasses = faceAttributes.Eyeglasses;
    const sunglasses = faceAttributes.Sunglasses;
    if (eyeglasses?.Value || sunglasses?.Value) {
      attributeCards.push({
        icon: _jsx(Glasses, { className: "w-5 h-5 text-indigo-500" }),
        title: "Eyewear",
        value: sunglasses?.Value ? "Sunglasses" : "Eyeglasses",
        color: "text-indigo-600",
      });
    }

    if (primaryEmotion && primaryEmotion.Type && primaryEmotion.Type !== "Unknown") {
      const emotionType = primaryEmotion.Type;
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

    const quality = faceAttributes.Quality;
    if (quality?.Brightness && quality?.Sharpness) {
      const brightness = quality.Brightness;
      const sharpness = quality.Sharpness;
      const clarity = Math.round((brightness + sharpness) / 2);
      const qualityLabel =
        clarity > 70 ? "Excellent" : clarity > 50 ? "Good" : "Fair";
      const qualityColor =
        clarity > 70 ? "text-green-600" : clarity > 50 ? "text-amber-600" : "text-orange-600";
      attributeCards.push({
        icon: _jsx(Zap, { className: "w-5 h-5 text-yellow-500" }),
        title: "Image Quality",
        value: `${qualityLabel} (${clarity}%)`,
        color: qualityColor,
      });
    }

    if (attributeCards.length === 0) {
      return _jsxs("div", {
        className:
          "mt-4 bg-white p-5 rounded-apple-xl border border-apple-gray-200 shadow-sm",
        children: [
           _jsx("h4", { className: "text-lg font-medium text-apple-gray-900 mb-3 flex items-center", children: "Face Analysis" }),
           _jsx("p", { className: "text-apple-gray-600", children: "Detailed face analysis is not available." }),
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
    ],
  });
};

export default Dashboard;
