import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const TermsAndPrivacy = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center text-sm font-medium text-blue-500 hover:text-blue-700 transition">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <div className="text-sm text-slate-500">SHMONG</div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 md:px-10 py-8 border-b border-slate-200">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Terms of Service & Privacy Policy</h1>
            <p className="text-slate-500 text-sm mt-2">Last updated: April 25, 2025</p>
          </div>
          
          <div className="px-6 md:px-10 py-8 prose prose-slate max-w-none">
            <h2>SECTION 1: TERMS OF SERVICE</h2>
            
            <h3>SUMMARY</h3>
            <p>This Terms of Service governs your use of SHMONG services. It explains your rights and responsibilities, payment terms, arbitration procedures, and other legal matters. By using our services, you agree to these terms.</p>
            
            <h3>1. ELIGIBILITY AND ACCOUNT CREATION</h3>
            <p>1.1. <strong>Age Restriction.</strong> You must be at least 18 years old to create an account and use our Services.</p>
            <p>1.2. <strong>Account Creation.</strong> To access certain features, you may need an account. You agree to provide accurate, current, and complete information during registration and keep it updated.</p>
            
            <h2>SECTION 2: PRIVACY POLICY</h2>
            
            <h3>SUMMARY</h3>
            <p>This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data. We collect personal information, usage data, and in some cases biometric data.</p>
            
            <h3>1. INFORMATION WE COLLECT</h3>
            <p>1.1. <strong>Personal Information.</strong> We collect information you provide when you:
              <ul>
                <li>Create an account (name, email, phone number)</li>
                <li>Use our services</li>
                <li>Contact customer support</li>
                <li>Participate in surveys or promotions</li>
              </ul>
            </p>
          </div>
          
          <div className="px-6 md:px-10 py-6 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-500">
                &copy; {new Date().getFullYear()} SHMONG. All rights reserved.
              </p>
              <div className="flex gap-4 text-sm">
                <Link to="/terms-of-service-and-privacy-policy" className="text-slate-600 hover:text-blue-600">Terms & Privacy</Link>
                <Link to="/biometrics-policy" className="text-slate-600 hover:text-blue-600">Biometrics Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TermsAndPrivacy; 