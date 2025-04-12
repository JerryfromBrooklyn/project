import React from 'react';
import { motion } from 'framer-motion';
import { AppleSection, AppleSectionTitle, AppleSectionSubtitle } from './ui/AppleSection';
import { AppleButton } from './ui/AppleButton';
import { AppleCard } from './ui/AppleCard';
import { ChevronRightIcon } from 'lucide-react';

const AppleLandingPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <AppleSection color="white" spacing="loose" centered>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-5xl mx-auto mb-12"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium font-sf-pro leading-tight tracking-tight mb-6">
            Beautiful design.
            <br />
            <span className="text-apple-blue">Simple experience.</span>
          </h1>
          <p className="text-xl md:text-2xl leading-relaxed text-apple-gray-600 max-w-3xl mx-auto mb-8">
            Experience our intuitive platform with an interface inspired by Apple's human-centered design principles.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <AppleButton size="lg" variant="primary">
              Get Started
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </AppleButton>
            <AppleButton size="lg" variant="secondary">
              Learn More
            </AppleButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="rounded-apple-xl overflow-hidden shadow-apple-lg mx-auto max-w-6xl"
        >
          <img 
            src="/images/dashboard-preview.jpg" 
            alt="Dashboard preview" 
            className="w-full h-auto"
            onError={(e) => {
              e.currentTarget.src = 'https://placehold.co/1200x800/0071e3/ffffff?text=Dashboard+Preview';
            }}
          />
        </motion.div>
      </AppleSection>

      {/* Features Section */}
      <AppleSection color="light" spacing="normal">
        <div className="text-center mb-16">
          <AppleSectionTitle>
            Designed with purpose
          </AppleSectionTitle>
          <AppleSectionSubtitle>
            Every detail has been carefully considered to provide you with the best experience.
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

      {/* Testimonial Section */}
      <AppleSection color="white" spacing="normal" centered>
        <AppleSectionTitle>
          Loved by users
        </AppleSectionTitle>
        <AppleSectionSubtitle>
          See what people are saying about our platform.
        </AppleSectionSubtitle>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <AppleCard padding="md" className="h-full">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-apple-gray-600 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center mt-auto">
                  <div className="w-10 h-10 rounded-full bg-apple-gray-200 flex items-center justify-center text-apple-gray-700 font-medium mr-3">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-apple-gray-500">{testimonial.title}</p>
                  </div>
                </div>
              </AppleCard>
            </motion.div>
          ))}
        </div>
      </AppleSection>

      {/* CTA Section */}
      <AppleSection color="dark" spacing="normal" centered>
        <div className="max-w-3xl mx-auto">
          <AppleSectionTitle className="text-white">
            Ready to get started?
          </AppleSectionTitle>
          <AppleSectionSubtitle className="text-apple-gray-300">
            Join thousands of satisfied users today and experience the difference.
          </AppleSectionSubtitle>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            <AppleButton size="lg" variant="primary">
              Sign Up Now
            </AppleButton>
            <AppleButton size="lg" variant="tertiary">
              Contact Sales
            </AppleButton>
          </motion.div>
        </div>
      </AppleSection>
    </div>
  );
};

// Sample feature data
const features = [
  {
    title: 'Intuitive Interface',
    description: 'Our clean, intuitive interface makes it easy to navigate and find what you need.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: 'Secure & Private',
    description: 'Your data is encrypted and protected with industry-leading security practices.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    title: 'Seamless Sync',
    description: 'Access your content from any device with real-time synchronization.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    title: 'Powerful Analytics',
    description: 'Gain insights with comprehensive analytics and reporting tools.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Customizable Workflows',
    description: 'Create personalized workflows that suit your specific needs.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
      </svg>
    ),
  },
  {
    title: '24/7 Support',
    description: 'Our dedicated support team is always available to assist you.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

// Sample testimonial data
const testimonials = [
  {
    name: 'Emma Wilson',
    title: 'Product Designer',
    quote: 'The beautiful interface and attention to detail makes this platform a joy to use every day.',
  },
  {
    name: 'James Roberts',
    title: 'Marketing Director',
    quote: 'I\'ve tried many similar tools, but nothing comes close to the seamless experience this platform provides.',
  },
  {
    name: 'Sarah Chen',
    title: 'Startup Founder',
    quote: 'This platform has transformed our workflow. The intuitive design makes onboarding new team members a breeze.',
  },
];

export default AppleLandingPage; 