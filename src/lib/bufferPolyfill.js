/**
 * Buffer Polyfill for Browser Environments
 * 
 * Provides a lightweight Buffer implementation for browsers where the Node.js
 * Buffer object is not available, allowing our AWS S3 upload code to work in browsers.
 */

// Check if we're in a browser and Buffer is not available
const isBrowser = typeof window !== 'undefined' && typeof window.Buffer === 'undefined';

// Only create the polyfill if needed
if (isBrowser) {
  // Create a global Buffer constructor that wraps Uint8Array
  window.Buffer = {
    from: (data, encoding) => {
      // Handle base64 string conversion
      if (typeof data === 'string' && encoding === 'base64') {
        // Convert base64 to binary string
        const binaryString = window.atob(data);
        // Create Uint8Array from binary string
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      
      // Handle array/Uint8Array
      if (Array.isArray(data) || data instanceof Uint8Array) {
        return new Uint8Array(data);
      }
      
      // Handle ArrayBuffer
      if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
      }
      
      // Handle string without encoding (use UTF-8)
      if (typeof data === 'string') {
        const encoder = new TextEncoder();
        return encoder.encode(data);
      }
      
      // Default fallback
      return new Uint8Array();
    },
    
    // Add isBuffer method for compatibility
    isBuffer: (obj) => {
      return obj instanceof Uint8Array;
    },

    // Add concat method for compatibility
    concat: (arrays) => {
      // Calculate the total length
      const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
      
      // Create a new array with the total length
      const result = new Uint8Array(totalLength);
      
      // Copy each array into the result
      let offset = 0;
      arrays.forEach(arr => {
        result.set(arr, offset);
        offset += arr.length;
      });
      
      return result;
    }
  };
  
  // Add prototype methods for compatibility
  Uint8Array.prototype.toString = function(encoding) {
    if (encoding === 'base64') {
      // Convert to base64
      let binary = '';
      const bytes = new Uint8Array(this.buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    }
    
    // Default to UTF-8
    const decoder = new TextDecoder();
    return decoder.decode(this);
  };
}

export default {}; // Export empty object to make it importable 