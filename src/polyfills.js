// Polyfills for Node.js built-ins in browser environments
// Handled by vite-plugin-node-polyfills

// Removed manual import/assignment as plugin should handle it
// import * as bufferModule from 'buffer'; // Import the entire module
// const { Buffer } = bufferModule; // Extract the named export

/*
if (typeof window !== 'undefined') {
  console.log('[POLYFILLS] polyfills.js applying polyfills...');

  // Assign Buffer explicitly - Handled by plugin
  // window.Buffer = window.Buffer || Buffer;
  // Assign global explicitly - Handled by plugin
  // window.global = window.global || window;

  // Log polyfill status
  // console.log('[POLYFILLS] Buffer defined on window?', typeof window.Buffer !== 'undefined');
  // console.log('[POLYFILLS] process defined globally?', typeof process !== 'undefined');
  // console.log('[POLYFILLS] global defined on window?', !!window.global);
}
*/

// Exporting Buffer might still be needed if other modules import it directly from here
// If not, this file might become obsolete
// export { Buffer }; // Named export
// export default { Buffer }; // Default export

// If this file serves no other purpose, it could potentially be removed,
// along with its import in main.tsx, but let's keep it minimal for now.
export {}; // Ensure it's treated as a module 