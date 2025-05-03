import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const BiometricsPolicy = () => {
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
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Biometrics Policy</h1>
            <p className="text-slate-500 text-sm mt-2">Last updated: April 25, 2025</p>
          </div>
          
          <div className="px-6 md:px-10 py-8 prose prose-slate max-w-none">
            <h2>SUMMARY</h2>
            <p>This Biometrics Policy governs how we collect, use, store, and protect biometric data. We collect biometric identifiers like facial geometry only with your explicit consent for specific purposes, such as face matching services. We implement strong security measures to protect this sensitive data and provide you with rights to access, delete, or withdraw consent for your biometric information.</p>
            
            <h2>1. BIOMETRIC DATA COLLECTION AND CONSENT</h2>
            <p>1.1. <strong>Collection Authorization.</strong> SHMONG maintains a publicly available written policy detailing retention schedules and destruction guidelines for Biometric Data. By accepting this Agreement, you consent to the collection, storage, use, and processing of your Biometric Data (e.g., facial geometry, templates, vectors derived from your Content).</p>
            
            <h2>2. STORAGE AND PROTECTION</h2>
            <p>2.1. <strong>Security Standards.</strong> We store, transmit, and protect Biometric Data using a reasonable standard of care within our industry, at least as protective as how we handle other confidential information.</p>
            
            <h2>3. USER RIGHTS</h2>
            <p>3.1. <strong>Right to Access.</strong> You have the right to confirm processing and access your Biometric Data.</p>
            <p>3.2. <strong>Right to Deletion.</strong> You may request deletion of your Biometric Data. SHMONG will permanently delete it from its systems within 45 days (subject to legal retention needs).</p>
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

export default BiometricsPolicy; 