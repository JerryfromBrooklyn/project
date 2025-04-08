// Polyfills for Node.js built-ins in browser environments
// This helps AWS SDK v3 and other Node.js modules work in browsers

// Import Buffer from the 'buffer' package
import { Buffer as BufferPolyfill } from 'buffer';

// Polyfill global
if (typeof window !== 'undefined') {
  window.global = window;
}

// Polyfill Buffer
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = BufferPolyfill;
}

// Polyfill process
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  window.process = { 
    env: {},
    browser: true,
    version: '',
    nextTick: (cb) => setTimeout(cb, 0),
    // Add cwd function that returns a fixed path for browser environments
    cwd: () => '/',
    // Add more Node.js process functions as needed
    platform: 'browser',
    argv: [],
    exit: (code) => console.log(`Process exit with code: ${code || 0}`)
  };
}

console.log('[POLYFILLS] Node.js compatibility polyfills loaded');
console.log('[POLYFILLS] global defined:', typeof global !== 'undefined');
console.log('[POLYFILLS] Buffer defined:', typeof Buffer !== 'undefined');
console.log('[POLYFILLS] process defined:', typeof process !== 'undefined');
console.log('[POLYFILLS] process.cwd defined:', typeof process.cwd === 'function');

export default {}; 