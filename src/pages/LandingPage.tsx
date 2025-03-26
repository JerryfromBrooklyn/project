import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthForms } from '../components/AuthForms';
import { useAuth } from '../context/AuthContext';
import { Camera, Search, Shield, Clock, Users, Image, Sparkles, ChevronRight, ExternalLink, Check, X, Zap, Lock, Timer } from 'lucide-react';
import { cn } from '../utils/cn';

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
  const [currentSlide, setCurrentSlide] = useState(0);
  
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

    return () => {
      observer.disconnect();
      sectionObserver.disconnect();
      clearInterval(slideInterval);
    };
  }, []);

  // Navigation items
  const navItems: NavItem[] = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" }
  ];

  // Features data
  const features: Feature[] = [
    {
      title: "Instant Recognition",
      description: "Our AI identifies your face in photos with 99.7% accuracy, even in low light and crowded scenes.",
      icon: <Search className="h-7 w-7" />,
      color: "bg-apple-blue-500",
      delay: 0
    },
    {
      title: "One-Click Access",
      description: "Find all your photos instantly without scrolling through hundreds of images. Save time and eliminate frustration.",
      icon: <Clock className="h-7 w-7" />,
      color: "bg-apple-green-500",
      delay: 0.1
    },
    {
      title: "Bank-Level Security",
      description: "Your facial data is encrypted and never shared. Only you can access your photos, maintaining complete privacy.",
      icon: <Shield className="h-7 w-7" />,
      color: "bg-apple-purple-500",
      delay: 0.2
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
    { number: "250,000+", label: "Photos Found" }
  ];

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

  const handleDashboardClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (!user) {
      e.preventDefault();
      setShowAuthModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  // iPhone mockup slides
  const slides = [
    {
      title: "Register Your Face",
      content: (
        <div className="relative w-[320px] h-[650px] bg-[#1A1A1A] rounded-[55px] shadow-2xl overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-black rounded-[50px]" />
          
          {/* Camera UI */}
          <div className="absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent">
            <div className="absolute inset-[4px] rounded-[50px] overflow-hidden">
              <div className="h-full w-full bg-gradient-to-tr from-black/5 to-transparent">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <img src="https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png" alt="SHMONG" className="w-[126px] mb-8" />
                  <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mb-4">
                    <Camera className="w-10 h-10 text-white/90" />
                  </div>
                  <p className="text-white/80 text-sm mb-2">Position your face in the frame</p>
                  <div className="w-[3px] h-2 bg-white/10 rounded-full" />
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
          
          {/* Processing UI */}
          <div className="absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent">
            <div className="absolute inset-[4px] rounded-[50px] overflow-hidden">
              <div className="h-full w-full bg-gradient-to-tr from-black/5 to-transparent">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <img src="https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png" alt="SHMONG" className="w-[126px] mb-8" />
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white" />
                  </div>
                  <p className="text-white/80 text-sm mb-2">Processing your photos...</p>
                  <div className="w-[3px] h-2 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
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
          
          {/* Success UI */}
          <div className="absolute inset-0 bg-gradient-to-br from-apple-blue-600/20 to-transparent">
            <div className="absolute inset-[4px] rounded-[50px] overflow-hidden">
              <div className="h-full w-full bg-gradient-to-tr from-black/5 to-transparent">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <img src="https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png" alt="SHMONG" className="w-[126px] mb-8" />
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-white/90 text-lg font-medium mb-2">5 Photos Found!</p>
                  <p className="text-white/60 text-sm">Ready to view and download</p>
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
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 backdrop-blur-md bg-white/90 border-b border-apple-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <img src="https://www.shmong.tv/wp-content/uploads/2023/05/main-logo.png" alt="SHMONG" className="h-8" />
            </div>
            
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-apple-gray-600 hover:text-apple-gray-900 text-sm font-medium"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDashboardClick}
                className="ios-button-primary"
              >
                {user ? 'Go to Dashboard' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Find Your Event Photos{" "}
                <span className="bg-gradient-to-b from-apple-blue-500 to-apple-blue-600 text-transparent bg-clip-text">
                  Instantly
                </span>
              </h1>
              <p className="text-xl text-apple-gray-600 mb-8">
                Using advanced facial recognition, SHMONG helps you discover all your photos from events in seconds.
              </p>
              <button
                onClick={handleDashboardClick}
                className="ios-button-primary"
              >
                Get Started
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="relative flex justify-center"
            >
              {/* iPhone mockup with current slide */}
              {slides[currentSlide].content}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose SHMONG</h2>
            <p className="text-xl text-apple-gray-600">
              Advanced technology meets simplicity for the perfect photo-finding experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                className="relative p-8 rounded-apple-xl border border-apple-gray-200 bg-white"
              >
                <div className={`${feature.color} w-12 h-12 rounded-full flex items-center justify-center text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-apple-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-8 rounded-apple-xl bg-white border border-apple-gray-200"
              >
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <div className={`text-4xl font-bold bg-gradient-to-b ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.value}
                </div>
                <div className="text-apple-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How SHMONG Works</h2>
            <p className="text-xl text-apple-gray-600">
              Three simple steps to never miss another photo of yourself
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: step.delay }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-apple-blue-500 flex items-center justify-center text-white">
                    {step.icon}
                  </div>
                  <div className="absolute -left-[3px] -right-[3px] top-[90px] h-[40px] pointer-events-none">
                    {index < processSteps.length - 1 && (
                      <div className="relative h-[30px]">
                        <div className="absolute top-1/2 -translate-y-1/2 w-full">
                          <div className="h-[3px] bg-apple-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-apple-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Stats Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustStats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-apple-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="text-apple-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta-section" className="py-24">
        <div className="max-w-3xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Find Your Photos?
            </h2>
            <p className="text-xl text-apple-gray-600 mb-8">
              Join thousands of others who are already using SHMONG to discover their event photos effortlessly.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleDashboardClick}
                className="ios-button-primary"
              >
                Get Started Now
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-apple-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <img src="https://www.shmong.tv/wp-content/uploads/2023/05/logo-white.png" alt="SHMONG" className="h-8 mb-6" />
              <p className="text-apple-gray-400">
                Making event photography accessible and enjoyable for everyone.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="#features" className="text-apple-gray-400 hover:text-white">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="#how-it-works" className="text-apple-gray-400 hover:text-white">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="#about" className="text-apple-gray-400 hover:text-white">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="#contact" className="text-apple-gray-400 hover:text-white">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-apple-gray-400 hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-apple-gray-400 hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-apple-gray-800 mt-12 pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <p className="text-apple-gray-400 text-sm">
                © {new Date().getFullYear()} SHMONG. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 sm:mt-0">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-apple-gray-400 hover:text-white"
                  >
                    <span className="sr-only">{link.name}</span>
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d={link.icon} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative mx-4"
            >
              <AuthForms
                isModal
                onClose={() => setShowAuthModal(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};