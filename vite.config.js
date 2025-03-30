// Import defineConfig without specifying from 'vite'
// This will rely on the globally available Vite during the build process
const defineConfig = (config) => config;
import { resolve } from 'path';

export default {
  // Basic build configuration
  build: {
    outDir: 'dist',
  },
  
  // Server configuration (development only)
  server: {
    port: 5173,
  },
  
  // Handle environment variables properly
  envPrefix: ['VITE_', 'REACT_APP_'],
}; 