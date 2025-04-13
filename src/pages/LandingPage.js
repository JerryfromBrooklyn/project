import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthForms } from '../components/AuthForms';
import { useAuth } from '../context/AuthContext';
import { Camera, Search, Shield, Clock, Users, Image, Check, Zap, Lock, Timer, Star, Award, Heart } from 'lucide-react';

export const LandingPage = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [photoCounter, setPhotoCounter] = useState(0);
    
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setIsVisible(true);
            }
        }, { threshold: 0.1 });

        const ctaSection = document.getElementById('cta-section');
        if (ctaSection) {
            observer.observe(ctaSection);
        }

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { rootMargin: '-10% 0px -90% 0px' });

        document.querySelectorAll('section[id]').forEach((section) => {
            sectionObserver.observe(section);
        });

        // Auto advance slides
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3);
        }, 5000);
        
        // Animated counter effect for photos found
        const counterInterval = setInterval(() => {
            setPhotoCounter(prev => {
                if (prev < 250000) {
                    return prev + 2500;
                }
                clearInterval(counterInterval);
                return 250000;
            });
        }, 30);

        return () => {
            observer.disconnect();
            sectionObserver.disconnect();
            clearInterval(slideInterval);
            clearInterval(counterInterval);
        };
    }, []);

    // Format numbers with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Navigation items
    const navItems = [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" }
    ];

    // Features data
    const features = [
        {
            title: "AI-Powered Recognition",
            description: "Our advanced technology finds your face in crowds, low light, and varied angles with 99.7% accuracy.",
            icon: _jsx(Search, { className: "h-7 w-7" }),
            color: "bg-apple-blue-500",
            delay: 0
        },
        {
            title: "Seconds, Not Hours",
            description: "Find all your photos instantly without scrolling through hundreds of images. Average search time: 3.2 seconds.",
            icon: _jsx(Clock, { className: "h-7 w-7" }),
            color: "bg-apple-green-500",
            delay: 0.1
        },
        {
            title: "Privacy Guaranteed",
            description: "Your facial data is encrypted with bank-level security. Only you decide who sees your photos.",
            icon: _jsx(Shield, { className: "h-7 w-7" }),
            color: "bg-apple-purple-500",
            delay: 0.2
        }
    ];

    // Use cases for both attendees and photographers
    const useCases = [
        {
            title: "For Event Attendees",
            description: "Never miss a special moment again. SHMONG finds all photos of you, eliminating the frustration of searching through endless galleries.",
            icon: _jsx(Heart, { className: "h-7 w-7" }),
            points: [
                "Discover photos of yourself within seconds",
                "Get notified when new photos of you are uploaded",
                "Share your memories directly to social media"
            ],
            color: "bg-gradient-to-r from-blue-500 to-indigo-600",
            delay: 0
        },
        {
            title: "For Event Photographers",
            description: "Deliver a premium service to your clients. SHMONG helps professional photographers organize, distribute, and monetize their event photos.",
            icon: _jsx(Camera, { className: "h-7 w-7" }),
            points: [
                "Automatic tagging and organization of photos",
                "Easy delivery system for clients to find their images",
                "Increase revenue with premium photo packages"
            ],
            color: "bg-gradient-to-r from-amber-500 to-orange-600",
            delay: 0.2
        },
        {
            title: "For Event Managers",
            description: "Boost your event's appeal and reach. SHMONG creates additional value for attendees while promoting your brand to a wider audience.",
            icon: _jsx(Award, { className: "h-7 w-7" }),
            points: [
                "Efficiently distribute photos to all event participants",
                "Gain popularity as image details include your branding",
                "Reach people who would never search for event photos otherwise"
            ],
            color: "bg-gradient-to-r from-green-500 to-teal-600",
            delay: 0.4
        },
        {
            title: "For Venues",
            description: "Increase walk-in traffic by reminding patrons of their memorable experiences at your venue, encouraging more return visits.",
            icon: _jsx(Image, { className: "h-7 w-7" }),
            points: [
                "Remind people of where they attended spontaneous events",
                "Bring in more foot traffic automatically when photos surface",
                "Create lasting impressions that drive repeat business"
            ],
            color: "bg-gradient-to-r from-purple-500 to-pink-600",
            delay: 0.6
        }
    ];

    // Stats data
    const stats = [
        {
            value: "99.7%",
            label: "Recognition Accuracy",
            color: "from-apple-blue-500 to-apple-blue-600",
            icon: _jsx(Zap, { className: "w-8 h-8 text-apple-blue-500" })
        },
        {
            value: "3.2 sec",
            label: "Average Search Time",
            color: "from-apple-green-500 to-teal-500",
            icon: _jsx(Timer, { className: "w-8 h-8 text-apple-green-500" })
        },
        {
            value: "100%",
            label: "Data Encryption",
            color: "from-apple-purple-500 to-pink-500",
            icon: _jsx(Lock, { className: "w-8 h-8 text-apple-purple-500" })
        }
    ];

    // Process steps data
    const processSteps = [
        {
            number: "01",
            title: "Register Your Face",
            description: "Create an account and securely register your face with our encrypted biometric system.",
            icon: _jsx(Users, { className: "h-7 w-7" }),
            delay: 0
        },
        {
            number: "02",
            title: "Attend Events",
            description: "Enjoy your events while photographers capture all the special moments throughout the venue.",
            icon: _jsx(Camera, { className: "h-7 w-7" }),
            delay: 0.2
        },
        {
            number: "03",
            title: "Find Your Photos",
            description: "Open SHMONG after the event and instantly see all photos featuring you, ready to download.",
            icon: _jsx(Image, { className: "h-7 w-7" }),
            delay: 0.4
        }
    ];

    // Trust stats data
    const trustStats = [
        { number: "50+", label: "Event Organizers" },
        { number: "120+", label: "Venues" },
        { number: "10,000+", label: "Users" },
        { number: formatNumber(photoCounter), label: "Photos Found" }
    ];

    // Social media links
    const socialLinks = [
        {
            name: 'facebook',
            href: '#',
            icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z'
        },
        {
            name: 'twitter',
            href: '#',
            icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z'
        },
        {
            name: 'instagram',
            href: '#',
            icon: 'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z'
        }
    ];

    const handleNavClick = (href) => {
        const element = document.querySelector(href);
        if (element) {
            const offset = 80; // Height of fixed header
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: window.pageYOffset + offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const handleDashboardClick = (e) => {
        if (!user) {
            e.preventDefault();
            setShowAuthModal(true);
        }
        else {
            navigate('/dashboard');
        }
    };

    // iPhone mockup slides
    const slides = [
        {
            title: "Register Your Face",
            content: (_jsxs("div", { className: "relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden", children: [_jsx("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent", children: _jsx("div", { className: "absolute inset-[4px] rounded-[50px] overflow-hidden", children: _jsx("div", { className: "h-full w-full bg-gradient-to-tr from-black/5 to-transparent", children: _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-white", children: [_jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "w-[126px] mb-8" }), _jsx("div", { className: "w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mb-4", children: _jsx(Camera, { className: "w-10 h-10 text-white/90" }) }), _jsx("p", { className: "text-white/80 text-sm mb-2", children: "Position your face in the frame" }), _jsx("div", { className: "w-[3px] h-2 bg-white/10 rounded-full" })] }) }) }) })] }))
        },
        {
            title: "Processing",
            content: (_jsxs("div", { className: "relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden", children: [_jsx("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent", children: _jsx("div", { className: "absolute inset-[4px] rounded-[50px] overflow-hidden", children: _jsx("div", { className: "h-full w-full bg-gradient-to-tr from-black/5 to-transparent", children: _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-white", children: [_jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "w-[126px] mb-8" }), _jsx("div", { className: "w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4", children: _jsx("div", { className: "w-10 h-10 flex items-center justify-center", children: _jsxs("div", { className: "relative w-10 h-10", children: [_jsx("div", { className: "absolute inset-0 rounded-full border-4 border-white/30" }), _jsx("div", { className: "absolute inset-0 rounded-full border-4 border-t-white animate-spin" }), _jsx("div", { className: "absolute inset-0 rounded-full border-b-2 border-white/60 animate-pulse" })] }) }) }), _jsx("p", { className: "text-white/80 text-sm mb-4", children: "Processing your photos..." }), _jsx("div", { className: "w-48 h-1.5 bg-white/10 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse", style: { width: '75%', boxShadow: '0 0 8px rgba(99, 179, 237, 0.6)' } }) })] }) }) }) })] }))
        },
        {
            title: "Photos Found",
            content: (_jsxs("div", { className: "relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden", children: [_jsx("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent", children: _jsx("div", { className: "absolute inset-[4px] rounded-[50px] overflow-hidden", children: _jsx("div", { className: "h-full w-full bg-gradient-to-tr from-black/5 to-transparent", children: _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-white", children: [_jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "w-[126px] mb-8" }), _jsx("div", { className: "w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4", children: _jsx(Check, { className: "w-12 h-12 text-white" }) }), _jsx("p", { className: "text-white/90 text-lg font-medium mb-2", children: "54 Photos Found!" }), _jsx("p", { className: "text-white/60 text-sm", children: "Ready to view and download" })] }) }) }) })] }))
        }
    ];

    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-white to-apple-gray-50 text-apple-gray-900 font-sans overflow-x-hidden", children: [
        // Header - Updated with a more modern transparent navbar
        _jsx("header", { className: "fixed inset-x-0 top-0 z-50 backdrop-blur-md bg-white/90 border-b border-apple-gray-100", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-20", children: [
            _jsx("div", { className: "flex items-center", children: _jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png", alt: "SHMONG", className: "h-10" }) }),
            _jsx("nav", { className: "hidden md:flex space-x-6", children: navItems.map((item) => (_jsx("button", { onClick: () => handleNavClick(item.href), className: "text-apple-gray-600 hover:text-apple-gray-900 text-sm font-medium", children: item.label }, item.href))) }),
            _jsx("div", { className: "flex items-center space-x-2", children: _jsx("button", { onClick: handleDashboardClick, className: "ios-button-primary bg-green-500 hover:bg-green-600", children: "Log In / Sign Up" }) })
        ] }) }) }),

        // Hero Section - Completely redesigned with modern aesthetics
        _jsx("section", { className: "pt-20 pb-24", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [
            _jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: "easeOut" }, className: "text-center lg:text-left", children: [
                _jsxs("h1", { className: "text-4xl md:text-6xl font-bold mb-6", children: [
                    "Find ", 
                    _jsx("span", { className: "bg-gradient-to-b from-blue-500 to-blue-600 text-transparent bg-clip-text", children: "YOUR PHOTOS" }), 
                    " at Events in Seconds"
                ] }),
                _jsx("p", { className: "text-xl text-apple-gray-600 mb-8", children: 
                    "Never miss a moment again. SHMONG's AI technology finds all photos of you at events and gatherings - no searching required."
                }),
                _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8", children: [
                    _jsx("button", { onClick: handleDashboardClick, className: "ios-button-primary bg-green-500 hover:bg-green-600", children: "Find My Photos" }),
                    _jsx("button", { onClick: () => handleNavClick('#how-it-works'), className: "ios-button-secondary", children: "See How It Works" })
                ] }),
                _jsxs("div", { className: "flex items-center justify-center lg:justify-start space-x-2 text-apple-gray-600", children: [
                    _jsx(Star, { className: "w-5 h-5 text-amber-500" }),
                    _jsxs("span", { className: "text-sm", children: [
                        "Already found ", 
                        _jsxs("span", { className: "font-bold text-amber-500", children: [formatNumber(photoCounter)] }),
                        " photos for our users"
                    ] })
                ] })
            ] }),

            // Animated device mockup
            _jsx(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: 0.2, ease: "easeOut" }, className: "relative flex justify-center", children: 
                slides[currentSlide].content
            })
        ] }) }) }),

        // Features Section - Enhanced with better visuals
        _jsx("section", { id: "features", className: "py-24 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [
            _jsx("h2", { className: "text-4xl font-bold mb-4", children: "Photo Finding, Reinvented" }),
            _jsx("p", { className: "text-xl text-apple-gray-600 max-w-3xl mx-auto", children: 
                "SHMONG combines cutting-edge AI with intelligent design for the most efficient photo discovery experience"
            })
        ] }),

        // Core features grid
        _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: 
            features.map((feature, index) => (
                _jsxs(motion.div, { 
                    initial: { opacity: 0, y: 30 }, 
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.5, delay: feature.delay }, 
                    className: "relative p-8 rounded-apple-xl border border-apple-gray-200 bg-white hover:shadow-lg transition-all duration-300", 
                    children: [
                        _jsx("div", { className: `${feature.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-6`, children: feature.icon }),
                        _jsx("h3", { className: "text-xl font-semibold mb-3", children: feature.title }),
                        _jsx("p", { className: "text-apple-gray-600", children: feature.description })
                    ]
                }, feature.title)
            ))
        }),

        // Stats showcase
        _jsx("div", { className: "mt-16 grid grid-cols-1 md:grid-cols-3 gap-8", children: 
            stats.map((stat, index) => (
                _jsxs(motion.div, { 
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.5, delay: index * 0.1 }, 
                    className: "text-center p-8 rounded-apple-xl bg-white border border-apple-gray-200 hover:shadow-lg transition-all duration-300", 
                    children: [
                        _jsx("div", { className: "flex justify-center mb-4", children: stat.icon }),
                        _jsx("div", { className: `text-4xl font-bold bg-gradient-to-b ${stat.color} bg-clip-text text-transparent mb-2`, children: stat.value }),
                        _jsx("div", { className: "text-apple-gray-600", children: stat.label })
                    ]
                }, stat.label)
            ))
        })
    ] }) }),

    // Use Cases Section - New section highlighting user types
    _jsx("section", { id: "use-cases", className: "py-24 bg-apple-gray-50", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { children: [
        _jsxs("div", { className: "text-center mb-16", children: [
            _jsx("h2", { className: "text-4xl font-bold mb-4", children: "Who Benefits from SHMONG?" }),
            _jsx("p", { className: "text-xl text-apple-gray-600 max-w-3xl mx-auto", children: 
                "Our technology creates value for everyone involved in event photography"
            })
        ] }),
        
        _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12", children: 
            useCases.map((useCase, index) => (
                _jsx(motion.div, { 
                    initial: { opacity: 0, y: 30 }, 
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.5, delay: useCase.delay }, 
                    className: "relative overflow-hidden rounded-apple-xl", 
                    children: 
                        _jsxs("div", { className: `relative p-8 rounded-apple-xl border border-gray-200 bg-white shadow-lg`, children: [
                            _jsx("div", { className: `absolute top-0 left-0 w-full h-2 ${useCase.color}` }),
                            _jsxs("div", { className: "mb-6", children: [
                                _jsx("div", { className: "w-14 h-14 rounded-full bg-apple-gray-100 flex items-center justify-center mb-4", children: 
                                    useCase.icon
                                }),
                                _jsx("h3", { className: "text-2xl font-semibold mb-3", children: useCase.title }),
                                _jsx("p", { className: "text-apple-gray-600 mb-6", children: useCase.description })
                            ] }),
                            
                            _jsx("ul", { className: "space-y-3", children: 
                                useCase.points.map((point, i) => (
                                    _jsxs("li", { className: "flex items-start", children: [
                                        _jsx("div", { className: "flex-shrink-0 mt-1", children: 
                                            _jsx(Check, { className: "h-5 w-5 text-green-500" })
                                        }),
                                        _jsx("span", { className: "ml-3 text-apple-gray-700", children: point })
                                    ] }, i)
                                ))
                            })
                        ] })
                }, useCase.title)
            ))
        })
    ] }) }) }),

    // Process Section - With clearer step visualization
    _jsx("section", { id: "how-it-works", className: "py-24 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
        _jsxs("div", { className: "text-center mb-16", children: [
            _jsx("h2", { className: "text-4xl font-bold mb-4", children: "How It Works" }),
            _jsx("p", { className: "text-xl text-apple-gray-600 max-w-3xl mx-auto", children: 
                "Our simple process makes finding your photos effortless"
            })
        ] }),
        
        _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 mt-12", children: 
            processSteps.map((step, index) => (
                _jsxs(motion.div, { 
                    initial: { opacity: 0, y: 30 }, 
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.5, delay: step.delay }, 
                    className: "relative", 
                    children: [
                        _jsxs("div", { className: "flex flex-col items-center text-center", children: [
                            _jsx("div", { className: "flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-apple-button mb-6", children: 
                                _jsx("div", { className: "w-14 h-14 rounded-full bg-apple-gray-900 flex items-center justify-center text-white", children: 
                                    step.icon
                                })
                            }),
                            
                            _jsx("h3", { className: "text-xl font-semibold mb-3", children: step.title }),
                            _jsx("p", { className: "text-apple-gray-600", children: step.description })
                        ] }),
                        
                        index < processSteps.length - 1 && (
                            _jsx("div", { className: "hidden md:block absolute top-10 left-full w-full h-px transform -translate-x-8 pointer-events-none" })
                        )
                    ]
                }, step.title)
            ))
        }),
        
        _jsx("div", { className: "text-center mt-16", children: 
            _jsx("button", { onClick: handleDashboardClick, className: "ios-button-primary", children: "Get Started" })
        })
    ] }) }),

    // CTA Section
    _jsx("section", { id: "cta-section", className: "py-24 bg-white", children: _jsx("div", { className: "max-w-3xl mx-auto text-center px-4", children: _jsxs(motion.div, { 
        initial: { opacity: 0, y: 30 }, 
        animate: isVisible ? { opacity: 1, y: 0 } : {}, 
        transition: { duration: 0.8 }, 
        children: [
            _jsx("h2", { className: "text-4xl font-bold mb-6", children: "Ready to Find Your Photos?" }),
            _jsx("p", { className: "text-xl text-apple-gray-600 mb-8", children: 
                "Join thousands of others who are already using SHMONG to discover their event photos effortlessly."
            }),
            _jsx("div", { className: "flex justify-center", children: 
                _jsx("button", { onClick: handleDashboardClick, className: "ios-button-primary bg-green-500 hover:bg-green-600 text-lg py-4 px-8", children: "Get Started Now" })
            })
        ]
    }) }) }),

    // Footer
    _jsx("footer", { className: "bg-apple-gray-900 text-white py-12", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [
        _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [
            _jsxs("div", { children: [
                _jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "h-8 mb-6" }),
                _jsx("p", { className: "text-apple-gray-400", children: "Making event photography accessible and enjoyable for everyone." })
            ] }),
            _jsxs("div", { children: [
                _jsx("h3", { className: "text-lg font-semibold mb-4", children: "Product" }),
                _jsxs("ul", { className: "space-y-2", children: [
                    _jsx("li", { children: _jsx(Link, { to: "#features", className: "text-apple-gray-400 hover:text-white", children: "Features" }) }),
                    _jsx("li", { children: _jsx(Link, { to: "#how-it-works", className: "text-apple-gray-400 hover:text-white", children: "How It Works" }) })
                ] })
            ] }),
            _jsxs("div", { children: [
                _jsx("h3", { className: "text-lg font-semibold mb-4", children: "Company" }),
                _jsxs("ul", { className: "space-y-2", children: [
                    _jsx("li", { children: _jsx(Link, { to: "#about", className: "text-apple-gray-400 hover:text-white", children: "About Us" }) }),
                    _jsx("li", { children: _jsx(Link, { to: "#contact", className: "text-apple-gray-400 hover:text-white", children: "Contact" }) })
                ] })
            ] }),
            _jsxs("div", { children: [
                _jsx("h3", { className: "text-lg font-semibold mb-4", children: "Legal" }),
                _jsxs("ul", { className: "space-y-2", children: [
                    _jsx("li", { children: _jsx(Link, { to: "/privacy", className: "text-apple-gray-400 hover:text-white", children: "Privacy Policy" }) }),
                    _jsx("li", { children: _jsx(Link, { to: "/terms", className: "text-apple-gray-400 hover:text-white", children: "Terms of Service" }) })
                ] })
            ] })
        ] }),
        _jsx("div", { className: "border-t border-apple-gray-800 mt-12 pt-8", children: _jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center", children: [
            _jsxs("p", { className: "text-apple-gray-400 text-sm", children: ["\u00A9 ", new Date().getFullYear(), " SHMONG. All rights reserved."] }),
            _jsx("div", { className: "flex space-x-6 mt-4 sm:mt-0", children: 
                socialLinks.map((link) => (
                    _jsxs("a", { 
                        href: link.href, 
                        className: "text-apple-gray-400 hover:text-white", 
                        children: [
                            _jsx("span", { className: "sr-only", children: link.name }),
                            _jsx("svg", { 
                                className: "h-6 w-6", 
                                fill: "currentColor", 
                                viewBox: "0 0 24 24", 
                                "aria-hidden": "true", 
                                children: _jsx("path", { d: link.icon })
                            })
                        ]
                    }, link.name)
                ))
            })
        ] }) })
    ] }) }),

    // Auth Modal
    _jsx(AnimatePresence, { children: 
        showAuthModal && (
            _jsx(motion.div, { 
                initial: { opacity: 0 }, 
                animate: { opacity: 1 }, 
                exit: { opacity: 0 }, 
                className: "fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center", 
                children: 
                    _jsx(motion.div, { 
                        initial: { opacity: 0, y: 20 }, 
                        animate: { opacity: 1, y: 0 }, 
                        exit: { opacity: 0, y: 20 }, 
                        className: "relative mx-4 max-w-md w-full max-h-[90vh] overflow-auto rounded-xl", 
                        children: 
                            _jsx(AuthForms, { isModal: true, onClose: () => setShowAuthModal(false) })
                    })
            })
        )
    })
] }));
};
