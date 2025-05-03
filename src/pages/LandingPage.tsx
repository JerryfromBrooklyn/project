import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthForms } from '../components/AuthForms';
import { useAuth } from '../context/AuthContext';
import { Camera, Search, Shield, Clock, Users, Image, Sparkles, ChevronRight, ExternalLink, Check, X, Zap, Lock, Timer, User, CheckCircle, Star } from 'lucide-react';
import { cn } from '../utils/cn';
import Footer from '../components/Footer';

interface NavItem {
  label: string;
  href: string;
}

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}

interface Stat {
  value: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
}

interface TrustStat {
  number: string;
  label: string;
}

interface SocialLink {
  name: string;
  href: string;
  icon: string;
}

interface MotionProps {
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  exit?: Record<string, number>;
  transition?: {
    duration?: number;
    delay?: number;
    ease?: string;
    repeat?: number;
    repeatType?: string;
  };
  viewport?: {
    once?: boolean;
    margin?: string;
  };
  className?: string;
}

export const LandingPage: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalView, setAuthModalView] = useState<'signin' | 'signup'>('signup');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [photoCounter, setPhotoCounter] = useState(0);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const ctaSection = document.getElementById('cta-section');
    if (ctaSection) {
      observer.observe(ctaSection);
    }

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -90% 0px' }
    );

    document.querySelectorAll<HTMLElement>('section[id]').forEach((section) => {
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

  // Navigation items
  const navItems: NavItem[] = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" }
  ];

  // Features data - Updated with focus on photo-finding efficiency
  const features: Feature[] = [
    {
      title: "AI-Powered Recognition",
      description: "Our advanced technology finds your face in crowds, low light, and varied angles with 99.7% accuracy.",
      icon: <Search className="h-7 w-7" />,
      color: "bg-apple-blue-500",
      delay: 0
    },
    {
      title: "Seconds, Not Hours",
      description: "Find all your photos instantly without scrolling through hundreds of images. Average search time: 3.2 seconds.",
      icon: <Clock className="h-7 w-7" />,
      color: "bg-apple-green-500",
      delay: 0.1
    },
    {
      title: "Privacy Guaranteed",
      description: "Your facial data is encrypted with bank-level security. Only you decide who sees your photos.",
      icon: <Shield className="h-7 w-7" />,
      color: "bg-apple-purple-500",
      delay: 0.2
    }
  ];

  // Use cases for both attendees and photographers
  const useCases = [
    {
      title: "For Event Attendees",
      description: "Never miss a special moment again. SHMONG finds all photos of you, eliminating the frustration of searching through endless galleries.",
      icon: <User className="h-7 w-7" />,
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
      icon: <Camera className="h-7 w-7" />,
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
      icon: <Sparkles className="h-7 w-7" />,
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
      icon: <Image className="h-7 w-7" />,
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
  const stats: Stat[] = [
    { 
      value: "99.7%", 
      label: "Recognition Accuracy", 
      color: "from-apple-blue-500 to-apple-blue-600",
      icon: <Zap className="w-8 h-8 text-apple-blue-500" />
    },
    { 
      value: "3.2 sec", 
      label: "Average Search Time", 
      color: "from-apple-green-500 to-teal-500",
      icon: <Timer className="w-8 h-8 text-apple-green-500" />
    },
    { 
      value: "100%", 
      label: "Data Encryption", 
      color: "from-apple-purple-500 to-pink-500",
      icon: <Lock className="w-8 h-8 text-apple-purple-500" />
    }
  ];

  // Process steps data
  const processSteps: ProcessStep[] = [
    {
      number: "01",
      title: "Register Your Face",
      description: "Create an account and securely register your face with our encrypted biometric system.",
      icon: <Users className="h-7 w-7" />,
      delay: 0
    },
    {
      number: "02",
      title: "Attend Events",
      description: "Enjoy your events while photographers capture all the special moments throughout the venue.",
      icon: <Camera className="h-7 w-7" />,
      delay: 0.2
    },
    {
      number: "03",
      title: "Find Your Photos",
      description: "Open SHMONG after the event and instantly see all photos featuring you, ready to download.",
      icon: <Image className="h-7 w-7" />,
      delay: 0.4
    }
  ];

  // Trust stats data
  const trustStats: TrustStat[] = [
    { number: "50+", label: "Event Organizers" },
    { number: "120+", label: "Venues" },
    { number: "10,000+", label: "Users" },
    { number: formatNumber(photoCounter), label: "Photos Found" }
  ];

  // Function to format numbers with commas
  function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Social media links
  const socialLinks: SocialLink[] = [
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

  const handleNavClick = (href: string): void => {
    const element = document.querySelector<HTMLElement>(href);
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

  const handleLoginSignupClick = (e: React.MouseEvent<HTMLButtonElement>, view: 'signin' | 'signup'): void => {
    e.preventDefault();
    setAuthModalView(view);
    setShowAuthModal(true);
  };

  const handleDashboardClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (!user) {
      e.preventDefault();
      setAuthModalView('signup');
      setShowAuthModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  // iPhone mockup slides - Refined animations and content
  const slides = [
    {
      title: "Register Your Face",
      content: (
        <div className="relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" />
          {/* Updated scan visual */}
          <div className="absolute inset-0 bg-gradient-to-br from-apple-blue-600/10 to-transparent">
            <div className="absolute inset-[4px] rounded-[50px] overflow-hidden">
              <div className="h-full w-full bg-gradient-to-tr from-black/5 to-transparent">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                  <img src="https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png" alt="SHMONG" className="w-[100px] mb-10 opacity-80" />
                  <div className="relative w-32 h-32 mb-6">
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 animate-pulse"/>
                    <div className="absolute inset-2 rounded-full border-2 border-blue-400/50 animate-pulse animation-delay-200"/>
                    <div className="absolute inset-4 rounded-full border-2 border-blue-400/70 animate-pulse animation-delay-400"/>
                    <div className="absolute inset-6 rounded-full bg-blue-500/20"/>
                  </div>
                  <p className="text-white/90 text-lg font-medium mb-2">Ready for Your Scan</p>
                  <p className="text-white/60 text-sm text-center">Align your face within the guides</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Processing",
      content: (
        <div className="relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" />
          {/* Removed gradient overlays, content now directly on #1A1A1A background */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
            <img src="https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png" alt="SHMONG" className="w-[100px] mb-10 opacity-80" />
            {/* Enhanced loading animation */}
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-green-500/30"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-green-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-b-2 border-green-400/50 animate-pulse"></div>
              <div className="absolute inset-4 rounded-full border-l-1 border-green-300/40 animate-ping"></div>
            </div>
            <p className="text-white/80 text-lg font-medium mb-2">Finding Your Photos...</p>
            <p className="text-white/60 text-sm text-center">Our AI is scanning the event gallery</p>
          </div>
        </div>
      )
    },
    {
      title: "Photos Found",
      content: (
        <div className="relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" />
          {/* Updated success visual */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent">
            <div className="absolute inset-[4px] rounded-[50px] overflow-hidden">
              <div className="h-full w-full bg-gradient-to-tr from-black/5 to-transparent">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                  <img src="https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png" alt="SHMONG" className="w-[100px] mb-10 opacity-80" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mb-5 shadow-lg">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">54 Photos Found!</p>
                  <p className="text-white/70 text-base">Ready to view and share</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-apple-gray-50 text-apple-gray-900 font-sans overflow-x-hidden">
      {/* Header - Adjusted padding, nav button styling, and Log In button color */}
      <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-md bg-white/90 border-b border-apple-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16"> {/* Reduced height */}
            <div className="flex items-center">
              <img src="https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png" alt="SHMONG" className="h-8" /> {/* Smaller logo */}
            </div>

            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm font-medium text-apple-gray-600 hover:text-apple-gray-900 transition-colors" // Standard nav button
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Adjusted text sizes, spacing, and button styles */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24"> {/* Standardized Padding */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"> {/* Increased Gap */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }} // Adjusted transition
              className="text-center lg:text-left"
            >
              <h1 className="text-3xl md:text-5xl font-bold mb-5"> {/* Adjusted H1 size */}
                Find <span className="bg-gradient-to-b from-blue-500 to-blue-600 text-transparent bg-clip-text">YOUR PHOTOS</span> at Events in Seconds
              </h1>
              <p className="text-lg text-apple-gray-600 mb-8"> {/* Adjusted P size */}
                Never miss a moment again. SHMONG's AI technology finds all photos of you at events and gatherings - no searching required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8"> {/* Adjusted Gap */}
                <Link
                  to="/signup"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg text-base transition-colors text-center"
                >
                  Find My Photos
                </Link>
                <button
                  onClick={() => handleNavClick('#how-it-works')}
                  // Standard HIG Secondary Button
                  className="bg-apple-gray-100 hover:bg-apple-gray-200 text-blue-500 font-semibold py-2.5 px-5 rounded-lg text-base transition-colors"
                >
                  See How It Works
                </button>
              </div>

              <div className="flex items-center justify-center lg:justify-start space-x-2 text-apple-gray-600">
                <Star className="w-5 h-5 text-amber-500" /> {/* Changed Icon */}
                <span className="text-sm">
                  Already found <span className="font-bold text-amber-500">{formatNumber(photoCounter)}</span> photos for our users
                </span>
              </div>
            </motion.div>

            {/* Animated device mockup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }} // Adjusted transition
              className="relative flex justify-center"
            >
              {slides[currentSlide].content}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - Adjusted padding, text sizes, card styling */}
      <section id="features" className="py-16 md:py-20 bg-white"> {/* Standardized Padding */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16"> {/* Adjusted Margin */}
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Photo Finding, Reinvented</h2> {/* Adjusted H2 size */}
            <p className="text-lg text-apple-gray-600 max-w-3xl mx-auto"> {/* Adjusted P size */}
              SHMONG combines cutting-edge AI with intelligent design for the most efficient photo discovery experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Adjusted Gap */}
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: feature.delay * 0.5 }} // Adjusted delay
                // Simplified Card Style
                className="p-6 rounded-xl border border-apple-gray-100 bg-white hover:shadow-md transition-shadow duration-300"
              >
                <div className={`${feature.color} w-10 h-10 rounded-lg flex items-center justify-center text-white mb-4`}> {/* Adjusted Icon Box */}
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3> {/* Adjusted H3 style */}
                <p className="text-base text-apple-gray-600">{feature.description}</p> {/* Adjusted P style */}
              </motion.div>
            ))}
          </div>

          <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"> {/* Adjusted Margin/Gap */}
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }} // Adjusted delay
                // Simplified Stat Card Style
                className="text-center p-6 rounded-xl bg-apple-gray-50 border border-apple-gray-100"
              >
                <div className="flex justify-center mb-3">{stat.icon}</div> {/* Adjusted margin */}
                <div className={`text-3xl font-bold bg-gradient-to-b ${stat.color} bg-clip-text text-transparent mb-1`}>{stat.value}</div> {/* Adjusted size/margin */}
                <div className="text-sm text-apple-gray-600">{stat.label}</div> {/* Adjusted size */}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section - Adjusted padding, text sizes, card styling */}
      <section id="use-cases" className="py-16 md:py-20 bg-apple-gray-50"> {/* Standardized Padding */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div>
            <div className="text-center mb-12 md:mb-16"> {/* Adjusted Margin */}
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Who Benefits from SHMONG?</h2> {/* Adjusted H2 size */}
              <p className="text-lg text-apple-gray-600 max-w-3xl mx-auto"> {/* Adjusted P size */}
                Our technology creates value for everyone involved in event photography
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> {/* Adjusted Gap */}
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: useCase.delay * 0.5 }} // Adjusted delay
                  className="relative overflow-hidden rounded-xl" // Consistent rounding
                >
                  {/* Simplified Card Style */}
                  <div className={`relative p-6 border border-apple-gray-100 bg-white shadow-sm`}>
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${useCase.color}`}></div> {/* Thinner accent */}
                    <div className="mb-4"> {/* Adjusted Margin */}
                      <div className="w-10 h-10 rounded-lg bg-apple-gray-100 flex items-center justify-center mb-3"> {/* Adjusted Icon Box */}
                        {useCase.icon}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{useCase.title}</h3> {/* Adjusted H3 style */}
                      <p className="text-base text-apple-gray-600 mb-4">{useCase.description}</p> {/* Adjusted P style/margin */}
                    </div>

                    <ul className="space-y-2"> {/* Adjusted Spacing */}
                      {useCase.points.map((point, i) => (
                        <li key={i} className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5"> {/* Adjusted Check Alignment */}
                            <CheckCircle className="h-4 w-4 text-green-500" /> {/* Adjusted Check size */}
                          </div>
                          <span className="ml-2 text-sm text-apple-gray-700">{point}</span> {/* Adjusted Text size/margin */}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section - Adjusted padding, text sizes, card styling */}
      <section id="how-it-works" className="py-16 md:py-20 bg-white"> {/* Standardized Padding */}
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16"> {/* Adjusted Margin */}
            <h2 className="text-2xl md:text-3xl font-bold mb-4">How It Works</h2> {/* Adjusted H2 size */}
            <p className="text-lg text-apple-gray-600 max-w-3xl mx-auto"> {/* Adjusted P size */}
              Our simple process makes finding your photos effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-12"> {/* Adjusted Gap */}
            {processSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: step.delay * 0.5 }} // Adjusted delay
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-apple-gray-100 mb-4"> {/* Adjusted Icon BG */}
                    <div className="w-12 h-12 rounded-lg bg-apple-gray-900 flex items-center justify-center text-white"> {/* Adjusted Icon Container */}
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3> {/* Adjusted H3 style */}
                  <p className="text-base text-apple-gray-600">{step.description}</p> {/* Adjusted P style */}
                </div>

                {index < processSteps.length - 1 && (
                  // Added subtle connector line
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-apple-gray-200 transform translate-x-1/2 -z-10"></div>
                )}
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12 md:mt-16"> {/* Adjusted Margin */}
            <Link
              to="/signup"
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-5 rounded-lg text-base transition-colors inline-block"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Adjusted padding, text sizes, button style */}
      <section id="cta-section" className="py-16 md:py-20 bg-apple-gray-50"> {/* Standardized Padding */}
        <div className="max-w-3xl mx-auto text-center px-6"> {/* Consistent Padding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }} // Adjusted duration
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Find Your Photos?</h2> {/* Adjusted H2 size */}
            <p className="text-lg text-apple-gray-600 mb-8"> {/* Adjusted P size */}
              Join thousands of others who are already using SHMONG to discover their event photos effortlessly.
            </p>
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors inline-block"
              >
                Get Started Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Add Footer component */}
      <Footer />

      {/* Auth Modal - Adjusted styling */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Darker backdrop, added padding
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }} // Smoother transition
              // Standard rounding, bg, shadow
              className="relative mx-auto max-w-md w-full max-h-[90vh] overflow-auto rounded-2xl bg-white shadow-xl"
            >
              <AuthForms
                defaultView={authModalView}
                isModal={true}
                onClose={() => setShowAuthModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};