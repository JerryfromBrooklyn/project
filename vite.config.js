import { defineConfig } from 'vite';
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