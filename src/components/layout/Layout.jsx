import React from 'react';
import Header from './Header';

/**
 * Main layout component that wraps all pages
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Photo App. All rights reserved.</p>
          <p className="mt-1">Built with Supabase, React, and AWS Rekognition</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 