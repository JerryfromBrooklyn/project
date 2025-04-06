import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthForms } from '../components/AuthForms';
import { useAuth } from '../context/AuthContext';
import { Camera, Search, Shield, Clock, Users, Image, Check, Zap, Lock, Timer } from 'lucide-react';
export const LandingPage = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [activeSection, setActiveSection] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [authType, setAuthType] = useState('signin');
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
        return () => {
            observer.disconnect();
            sectionObserver.disconnect();
            clearInterval(slideInterval);
        };
    }, []);
    // Navigation items
    const navItems = [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "About", href: "#about" }
    ];
    // Features data
    const features = [
        {
            title: "Instant Recognition",
            description: "Our AI identifies your face in photos with 99.7% accuracy, even in low light and crowded scenes.",
            icon: _jsx(Search, { className: "h-7 w-7" }),
            color: "bg-apple-blue-500",
            delay: 0
        },
        {
            title: "One-Click Access",
            description: "Find all your photos instantly without scrolling through hundreds of images. Save time and eliminate frustration.",
            icon: _jsx(Clock, { className: "h-7 w-7" }),
            color: "bg-apple-green-500",
            delay: 0.1
        },
        {
            title: "Bank-Level Security",
            description: "Your facial data is encrypted and never shared. Only you can access your photos, maintaining complete privacy.",
            icon: _jsx(Shield, { className: "h-7 w-7" }),
            color: "bg-apple-purple-500",
            delay: 0.2
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
        { number: "250,000+", label: "Photos Found" }
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
            setAuthType('signin');
            setShowAuthModal(true);
        } else {
            navigate('/dashboard');
        }
    };
    const handleSignupClick = (e) => {
        e.preventDefault();
        setAuthType('signup');
        setShowAuthModal(true);
    };
    // iPhone mockup slides
    const slides = [
        {
            title: "Register Your Face",
            content: (_jsxs("div", { className: "relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden", children: [_jsx("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent", children: _jsx("div", { className: "absolute inset-[4px] rounded-[50px] overflow-hidden", children: _jsx("div", { className: "h-full w-full bg-gradient-to-tr from-black/5 to-transparent", children: _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-white", children: [_jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "w-[126px] mb-8" }), _jsx("div", { className: "w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mb-4", children: _jsx(Camera, { className: "w-10 h-10 text-white/90" }) }), _jsx("p", { className: "text-white/80 text-sm mb-2", children: "Position your face in the frame" }), _jsx("div", { className: "w-[3px] h-2 bg-white/10 rounded-full" })] }) }) }) })] }))
        },
        {
            title: "Processing",
            content: (_jsxs("div", { className: "relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden", children: [_jsx("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent", children: _jsx("div", { className: "absolute inset-[4px] rounded-[50px] overflow-hidden", children: _jsx("div", { className: "h-full w-full bg-gradient-to-tr from-black/5 to-transparent", children: _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-white", children: [_jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "w-[126px] mb-8" }), _jsx("div", { className: "w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4", children: _jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white" }) }), _jsx("p", { className: "text-white/80 text-sm mb-2", children: "Processing your photos..." }), _jsx("div", { className: "w-[3px] h-2 bg-white/10 rounded-full" })] }) }) }) })] }))
        },
        {
            title: "Photos Found",
            content: (_jsxs("div", { className: "relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden", children: [_jsx("div", { className: "absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent", children: _jsx("div", { className: "absolute inset-[4px] rounded-[50px] overflow-hidden", children: _jsx("div", { className: "h-full w-full bg-gradient-to-tr from-black/5 to-transparent", children: _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-white", children: [_jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "w-[126px] mb-8" }), _jsx("div", { className: "w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4", children: _jsx(Check, { className: "w-12 h-12 text-white" }) }), _jsx("p", { className: "text-white/90 text-lg font-medium mb-2", children: "5 Photos Found!" }), _jsx("p", { className: "text-white/60 text-sm", children: "Ready to view and download" })] }) }) }) })] }))
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-white to-apple-gray-50 text-apple-gray-900 font-sans overflow-x-hidden", children: [_jsx("header", { className: "fixed inset-x-0 top-0 z-50 backdrop-blur-md bg-white/90 border-b border-apple-gray-100", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex justify-between items-center h-20", children: [_jsx("div", { className: "flex items-center", children: _jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png", alt: "SHMONG", className: "h-8" }) }), _jsx("nav", { className: "hidden md:flex space-x-6", children: navItems.map((item) => (_jsx("button", { onClick: () => handleNavClick(item.href), className: "text-apple-gray-600 hover:text-apple-gray-900 text-sm font-medium", children: item.label }, item.href))) }), _jsx("div", { className: "flex items-center space-x-2", children: _jsx("button", { 
        onClick: user ? handleDashboardClick : handleSignupClick, 
        className: "rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm text-white font-medium shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-all duration-300", 
        children: user ? 'Go to Dashboard' : 'Sign Up' 
    }) })] }) }) }), _jsx("section", { className: "pt-32 pb-24", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 items-center", children: [
        _jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: "easeOut" }, className: "text-center lg:text-left", children: [
            _jsxs("h1", { className: "text-4xl md:text-6xl font-bold tracking-tight mb-6", children: ["Find Your Event Photos", " ", _jsx("span", { className: "bg-gradient-to-b from-apple-blue-500 to-apple-blue-600 text-transparent bg-clip-text", children: "Instantly" })] }),
            _jsx("p", { className: "text-xl text-apple-gray-600 mb-10", children: "Using advanced facial recognition, SHMONG helps you discover all your photos from events in seconds." }),
            _jsx("button", { 
                onClick: handleDashboardClick, 
                className: "ios-button-primary bg-apple-blue-500 hover:bg-apple-blue-600 text-white px-8 py-3.5 rounded-full text-base font-medium transition-all duration-300 shadow-lg hover:shadow-xl", 
                children: "Get Started" 
            })
        ] }),
        _jsx(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: 0.2, ease: "easeOut" }, className: "relative flex justify-center", children: slides[currentSlide].content })
    ] }) }) }), _jsx("section", { id: "features", className: "py-24 bg-white", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold mb-4", children: "Why Choose SHMONG" }), _jsx("p", { className: "text-xl text-apple-gray-600", children: "Advanced technology meets simplicity for the perfect photo-finding experience" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8", children: features.map((feature, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: feature.delay }, className: "relative p-8 rounded-apple-xl border border-apple-gray-200 bg-white", children: [_jsx("div", { className: `${feature.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-6`, children: feature.icon }), _jsx("h3", { className: "text-xl font-semibold mb-3", children: feature.title }), _jsx("p", { className: "text-apple-gray-600", children: feature.description })] }, feature.title))) }), _jsx("div", { className: "mt-12 grid grid-cols-1 md:grid-cols-3 gap-8", children: stats.map((stat, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: index * 0.1 }, className: "text-center p-8 rounded-apple-xl bg-white border border-apple-gray-200", children: [_jsx("div", { className: "flex justify-center mb-4", children: stat.icon }), _jsx("div", { className: `text-4xl font-bold bg-gradient-to-b ${stat.color} bg-clip-text text-transparent mb-2`, children: stat.value }), _jsx("div", { className: "text-apple-gray-600", children: stat.label })] }, stat.label))) })] }) }), _jsx("section", { id: "how-it-works", className: "py-24", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold mb-4", children: "How SHMONG Works" }), _jsx("p", { className: "text-xl text-apple-gray-600", children: "Three simple steps to never miss another photo of yourself" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-12", children: processSteps.map((step, index) => (_jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: step.delay }, className: "text-center", children: [
        _jsx("div", { className: "w-20 h-20 mx-auto rounded-full bg-apple-blue-500 flex items-center justify-center text-white mb-6", children: step.icon }),
        _jsx("h3", { className: "text-xl font-semibold mb-3", children: step.title }), _jsx("p", { className: "text-apple-gray-600", children: step.description })] }, step.title))) })] }) }), _jsx("section", { className: "py-24 bg-white", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-8", children: trustStats.map((stat) => (_jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 }, className: "text-center", children: [_jsx("div", { className: "text-4xl font-bold text-apple-gray-900 mb-2", children: stat.number }), _jsx("div", { className: "text-apple-gray-600", children: stat.label })] }, stat.label))) }) }) }), _jsx("section", { id: "cta-section", className: "py-24", children: _jsx("div", { className: "max-w-3xl mx-auto text-center px-4", children: _jsxs(motion.div, { initial: { opacity: 0, y: 30 }, animate: isVisible ? { opacity: 1, y: 0 } : {}, transition: { duration: 0.8 }, children: [_jsx("h2", { className: "text-4xl font-bold mb-6", children: "Ready to Find Your Photos?" }), _jsx("p", { className: "text-xl text-apple-gray-600 mb-8", children: "Join thousands of others who are already using SHMONG to discover their event photos effortlessly." }), _jsx("div", { className: "flex justify-center", children: _jsx("button", { 
        onClick: handleDashboardClick, 
        className: "ios-button-primary bg-apple-blue-500 hover:bg-apple-blue-600 text-white px-8 py-3.5 rounded-full text-base font-medium transition-all duration-300 shadow-lg hover:shadow-xl", 
        children: "Get Started Now" 
    }) })] }) }) }), _jsx("footer", { className: "bg-apple-gray-900 text-white py-12", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-8", children: [_jsxs("div", { children: [_jsx("img", { src: "https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png", alt: "SHMONG", className: "h-8 mb-6" }), _jsx("p", { className: "text-apple-gray-400", children: "Making event photography accessible and enjoyable for everyone." })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Product" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx(Link, { to: "#features", className: "text-apple-gray-400 hover:text-white", children: "Features" }) }), _jsx("li", { children: _jsx(Link, { to: "#how-it-works", className: "text-apple-gray-400 hover:text-white", children: "How It Works" }) })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Company" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx(Link, { to: "#about", className: "text-apple-gray-400 hover:text-white", children: "About Us" }) }), _jsx("li", { children: _jsx(Link, { to: "#contact", className: "text-apple-gray-400 hover:text-white", children: "Contact" }) })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold mb-4", children: "Legal" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx(Link, { to: "/privacy", className: "text-apple-gray-400 hover:text-white", children: "Privacy Policy" }) }), _jsx("li", { children: _jsx(Link, { to: "/terms", className: "text-apple-gray-400 hover:text-white", children: "Terms of Service" }) })] })] })] }), _jsx("div", { className: "border-t border-apple-gray-800 mt-12 pt-8", children: _jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-center", children: [_jsxs("p", { className: "text-apple-gray-400 text-sm", children: ["\u00A9 ", new Date().getFullYear(), " SHMONG. All rights reserved."] }), _jsx("div", { className: "flex space-x-6 mt-4 sm:mt-0", children: socialLinks.map((link) => (_jsxs("a", { href: link.href, className: "text-apple-gray-400 hover:text-white", children: [_jsx("span", { className: "sr-only", children: link.name }), _jsx("svg", { className: "h-6 w-6", fill: "currentColor", viewBox: "0 0 24 24", "aria-hidden": "true", children: _jsx("path", { d: link.icon }) })] }, link.name))) })] }) })] }) }), _jsx(AnimatePresence, { children: showAuthModal && (_jsx(motion.div, { 
        initial: { opacity: 0 }, 
        animate: { opacity: 1 }, 
        exit: { opacity: 0 }, 
        className: "fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center", 
        children: _jsx(motion.div, { 
            initial: { opacity: 0, y: 20 }, 
            animate: { opacity: 1, y: 0 }, 
            exit: { opacity: 0, y: 20 }, 
            className: "relative mx-4 w-full max-w-md", 
            children: _jsx(AuthForms, { 
                isModal: true, 
                defaultView: authType,
                onClose: () => setShowAuthModal(false) 
            }) 
        }) 
    })) })] }));
};
