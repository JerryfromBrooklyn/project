import React from 'react';

/**
 * A simple test component with distinctive styling
 * This is used to verify that UI changes are properly reflected
 */
const SimpleTest = () => {
  // Create timestamp to verify component loads freshly
  const timestamp = new Date().toLocaleTimeString();
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-300 text-black p-4 z-50 border-b-4 border-red-500 flex justify-between items-center">
      <h1 className="text-2xl font-bold">TEST INDICATOR</h1>
      <div className="bg-red-500 text-white px-4 py-2 rounded-lg">
        Loaded at: {timestamp}
      </div>
    </div>
  );
};

export default SimpleTest; 