import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">© {new Date().getFullYear()} SHMONG. All rights reserved.</p>
          </div>
          
          <div className="flex space-x-6">
            <a 
              href="/terms.html"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Terms & Privacy Policy
            </a>
            <a 
              href="/biometrics.html"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Biometrics Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 