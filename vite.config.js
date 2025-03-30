// Import defineConfig without specifying from 'vite'
// This will rely on the globally available Vite during the build process
const defineConfig = (config) => config;
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  
  // Resolve aliases for consistent imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  
  // Server configuration (development only)
  server: {
    port: 5173,
  },
  
  // Handle environment variables properly
  envPrefix: ['VITE_', 'REACT_APP_'],
}); 