import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppleSection, AppleSectionTitle, AppleSectionSubtitle } from './ui/AppleSection';
import { AppleButton } from './ui/AppleButton';
import { AppleCard } from './ui/AppleCard';
import { ChevronRightIcon, Users, Image, Search, ShieldCheck, Clock, Camera, Heart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthForms } from './AuthForms';

const AppleLandingPage: React.FC = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const navigate = useNavigate();

  // Simulated loading animation for the "found photos" feature
  useEffect(() => {
    if (showLoadingAnimation) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 20);
      
      return () => clearInterval(interval);
    }
  }, [showLoadingAnimation]);

  const handleGetStarted = () => {
    setAuthView('signup');
    setShowAuthModal(true);
  };

  const handleLogin = () => {
    setAuthView('signin');
    setShowAuthModal(true);
  };

  const handleDemoAnimation = () => {
    setLoadingProgress(0);
    setShowLoadingAnimation(true);
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Camera className="h-7 w-7 text-apple-blue-500 mr-2" />
            <span className="text-xl font-semibold tracking-tight">PhotoMatch</span>
          </Link>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLogin}
              className="text-gray-700 font-medium hover:text-gray-900"
            >
              Log In
            </button>
            <button 
              onClick={handleLogin}
              className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-full transition-colors"
            >
              Log In / Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <AppleSection color="white" spacing="loose" centered>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium font-sf-pro leading-tight tracking-tight mb-6">
            Find all your photos.
            <br />
            <span className="text-apple-blue">Without the search.</span>
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed text-apple-gray-600 max-w-3xl mx-auto mb-8">
            Our facial recognition technology automatically finds photos of you from events you've attended. No more hunting through galleries or asking friends for pictures.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <AppleButton size="lg" variant="primary" onClick={handleGetStarted}>
              Get Started
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </AppleButton>
            <AppleButton size="lg" variant="secondary" onClick={handleDemoAnimation}>
              See How It Works
            </AppleButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="rounded-apple-xl overflow-hidden shadow-apple-lg mx-auto max-w-6xl"
        >
          {showLoadingAnimation ? (
            <div className="bg-gray-50 p-8 rounded-apple-xl">
              <div className="max-w-md mx-auto">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <Search className="h-5 w-5 text-apple-blue mr-2" />
                    <span className="font-medium">Scanning event photos...</span>
                  </div>
                  <span className="text-sm text-apple-gray-500">{loadingProgress}%</span>
                </div>
                
                <div className="h-2 bg-gray-200 rounded-full mb-6">
                  <motion.div 
                    className="h-full bg-apple-blue rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                
                {loadingProgress >= 100 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-green-50 border border-green-100 rounded-apple-xl p-6 flex items-start"
                  >
                    <div className="bg-green-100 rounded-full p-3 mr-4">
                      <Image className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-800 mb-1">Success! 54 photos found</h3>
                      <p className="text-green-700 text-sm mb-3">
                        We found 54 photos from the last event you attended. Ready to see them?
                      </p>
                      <button className="text-sm font-medium text-green-700 bg-green-100 px-4 py-2 rounded-full hover:bg-green-200 transition-colors">
                        View Photos
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          ) : (
            <img 
              src="/images/dashboard-preview.jpg" 
              alt="Dashboard preview" 
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/1200x800/0071e3/ffffff?text=PhotoMatch+Preview';
              }}
            />
          )}
        </motion.div>
      </AppleSection>

      {/* Features Section */}
      <AppleSection color="light" spacing="normal">
        <div className="text-center mb-16">
          <AppleSectionTitle>
            How it works
          </AppleSectionTitle>
          <AppleSectionSubtitle>
            Simple, secure, and intuitive photo discovery
          </AppleSectionSubtitle>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AppleCard interactive padding="lg" className="h-full">
                <div className="text-apple-blue mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-apple-gray-600">{feature.description}</p>
              </AppleCard>
            </motion.div>
          ))}
        </div>
      </AppleSection>

      {/* Use Cases Section */}
      <AppleSection color="white" spacing="normal" centered>
        <AppleSectionTitle>
          Perfect for everyone
        </AppleSectionTitle>
        <AppleSectionSubtitle>
          From event attendees to photographers, our platform benefits everyone
        </AppleSectionSubtitle>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col h-full"
            >
              <AppleCard padding="md" className="h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-full">
                    {useCase.icon}
                  </div>
                  <h3 className="text-xl font-medium">{useCase.title}</h3>
                </div>
                <p className="text-apple-gray-600 mb-4">{useCase.description}</p>
                <ul className="space-y-2 mt-auto">
                  {useCase.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start">
                      <div className="text-green-500 mr-2 mt-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </AppleCard>
            </motion.div>
          ))}
        </div>
      </AppleSection>

      {/* CTA Section */}
      <AppleSection color="dark" spacing="normal" centered>
        <div className="max-w-3xl mx-auto">
          <AppleSectionTitle className="text-white">
            Start finding your photos today
          </AppleSectionTitle>
          <AppleSectionSubtitle className="text-apple-gray-300">
            No more endless scrolling through galleries. Let our technology work for you.
          </AppleSectionSubtitle>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            <AppleButton size="lg" variant="primary" onClick={handleGetStarted}>
              Create Free Account
            </AppleButton>
            <AppleButton size="lg" variant="tertiary" onClick={handleLogin}>
              Already Registered? Log In
            </AppleButton>
          </motion.div>
        </div>
      </AppleSection>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md">
            <AuthForms 
              defaultView={authView} 
              isModal={true} 
              onClose={() => setShowAuthModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Feature data
const features = [
  {
    title: 'One-Time Registration',
    description: 'Register once with a selfie photo. Our system creates a secure facial signature that's used to find you in future photos.',
    icon: <Users className="h-10 w-10" />,
  },
  {
    title: 'Automatic Discovery',
    description: 'Our system automatically scans all new photos uploaded to the platform and notifies you when you appear in them.',
    icon: <Search className="h-10 w-10" />,
  },
  {
    title: 'Privacy First',
    description: 'You control your data. Approve which photos you want to keep and which to hide. All face data is encrypted and secure.',
    icon: <ShieldCheck className="h-10 w-10" />,
  },
  {
    title: 'Quick Access',
    description: 'No more waiting for event photographers to share albums. Get instant access to your photos as soon as they're uploaded.',
    icon: <Clock className="h-10 w-10" />,
  },
  {
    title: 'High Accuracy',
    description: 'Advanced facial recognition ensures high accuracy matches, even in group photos or different lighting conditions.',
    icon: <Image className="h-10 w-10" />,
  },
  {
    title: 'Easy Sharing',
    description: 'Instantly share found photos to social media or download them in high resolution for printing or keeping.',
    icon: <Heart className="h-10 w-10" />,
  },
];

// Use case data
const useCases = [
  {
    title: 'Event Attendees',
    description: 'Never miss a photo you appear in at events, parties, or gatherings.',
    icon: <Users className="h-6 w-6 text-blue-500" />,
    benefits: [
      'Automatically find all photos you appear in',
      'No need to check multiple photographer albums',
      'Get notified when new photos of you are uploaded',
      'Share event memories instantly with friends and family'
    ]
  },
  {
    title: 'Photographers & Event Organizers',
    description: 'Provide an enhanced experience for your clients and attendees.',
    icon: <Camera className="h-6 w-6 text-blue-500" />,
    benefits: [
      'Automatically organize photos by people appearing in them',
      'Simplify distribution of photos to event attendees',
      'Increase client satisfaction with innovative technology',
      'Differentiate your service from competitors'
    ]
  },
];

export default AppleLandingPage; 