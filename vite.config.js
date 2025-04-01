// Import defineConfig without specifying from 'vite'
// This will rely on the globally available Vite during the build process
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
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
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  }
});