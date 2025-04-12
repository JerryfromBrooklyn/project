import React from 'react';
import { AppleHero } from './ui/AppleHero';
import { AppleFeatureGrid } from './ui/AppleFeatureGrid';
import { AppleButton } from './ui/AppleButton';
import { AppleCard } from './ui/AppleCard';
import Navigation from './Navigation';

// Icons or placeholder image URLs
const featureIconPlaceholder = "https://via.placeholder.com/100";
const heroImageUrl = "https://via.placeholder.com/1200x600";

export default function LandingPage() {
  const features = [
    {
      iconUrl: featureIconPlaceholder,
      title: "Smart Notifications",
      description: "Get notified about important events and stay up to date with what matters to you the most."
    },
    {
      iconUrl: featureIconPlaceholder,
      title: "Cross-Device Sync",
      description: "Access your data from any device with seamless synchronization across platforms."
    },
    {
      iconUrl: featureIconPlaceholder,
      title: "Secure Storage",
      description: "Your data is encrypted and securely stored using industry-leading technology."
    },
    {
      iconUrl: featureIconPlaceholder,
      title: "Analytics Dashboard",
      description: "Gain insights with detailed analytics and visualization tools."
    },
    {
      iconUrl: featureIconPlaceholder,
      title: "Smart Search",
      description: "Find what you need quickly with our powerful search capabilities."
    },
    {
      iconUrl: featureIconPlaceholder,
      title: "Customizable Interface",
      description: "Personalize your experience with themes and layout options."
    }
  ];

  const testimonials = [
    {
      quote: "This product has completely transformed how I work. I can't imagine going back to my old workflow.",
      author: "Sarah Johnson",
      role: "Marketing Director"
    },
    {
      quote: "The intuitive design makes complex tasks simple. It's been a game-changer for our team.",
      author: "Michael Chen",
      role: "Product Manager"
    },
    {
      quote: "I've tried many similar products, but this one stands out for its reliability and thoughtful features.",
      author: "Emma Rodriguez",
      role: "UX Designer"
    }
  ];

  return (
    <div className="min-h-screen bg-apple-gray-50 dark:bg-apple-gray-900">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <AppleHero
          title="Powerful Tools for Modern Creators"
          subtitle="Introducing"
          description="Experience a new way to manage your digital life with our intuitive and powerful platform."
          imageUrl={heroImageUrl}
          primaryCta={{ text: "Get Started", href: "/signup" }}
          secondaryCta={{ text: "Learn More", href: "#features" }}
        />

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-24">
          <AppleFeatureGrid
            title="Designed for You"
            subtitle="Powerful features to help you take control of your digital experience"
            features={features}
            columns={3}
          />
        </section>

        {/* Testimonials Section */}
        <section className="bg-white dark:bg-apple-gray-800 py-24">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-medium text-center mb-16 text-apple-gray-900 dark:text-white tracking-tight">
              What Our Users Say
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <AppleCard key={index} className="h-full flex flex-col">
                  <blockquote className="flex-1">
                    <p className="text-lg text-apple-gray-600 dark:text-apple-gray-300 mb-6">
                      "{testimonial.quote}"
                    </p>
                    <footer>
                      <p className="font-medium text-apple-gray-900 dark:text-white">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">
                        {testimonial.role}
                      </p>
                    </footer>
                  </blockquote>
                </AppleCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-medium text-apple-gray-900 dark:text-white mb-6 tracking-tight">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-apple-gray-600 dark:text-apple-gray-300 mb-8 max-w-3xl mx-auto">
            Join thousands of users who have already transformed their digital experience with our platform.
          </p>
          <div className="flex justify-center gap-4">
            <AppleButton variant="primary" size="lg" onClick={() => window.location.href = "/signup"}>
              Sign Up Now
            </AppleButton>
            <AppleButton variant="secondary" size="lg" onClick={() => window.location.href = "/contact"}>
              Contact Sales
            </AppleButton>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-apple-gray-100 dark:bg-apple-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">About</a></li>
                <li><a href="/careers" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Careers</a></li>
                <li><a href="/blog" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Blog</a></li>
                <li><a href="/press" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Press</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="/features" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Features</a></li>
                <li><a href="/pricing" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Pricing</a></li>
                <li><a href="/security" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Security</a></li>
                <li><a href="/roadmap" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-apple-gray-900 dark:text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="/documentation" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Documentation</a></li>
                <li><a href="/help" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Help Center</a></li>
                <li><a href="/contact" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Contact Us</a></li>
                <li><a href="/status" className="text-apple-gray-600 dark:text-apple-gray-300 hover:text-apple-blue">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-apple-gray-200 dark:border-apple-gray-700 text-center text-apple-gray-500 dark:text-apple-gray-400">
            <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 