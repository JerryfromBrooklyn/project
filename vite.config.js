import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@mui/material', 'framer-motion'],
        },
      },
    },
  },
  
  // Resolve aliases for consistent imports
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@lib': resolve(__dirname, './src/lib'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@config': resolve(__dirname, './src/config'),
    },
  },
  
  // Server configuration (development only)
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: false,
    fs: {
      // Don't trigger rebuilds for .env changes
      watch: {
        ignored: ['**/.env*', '**/node_modules/**'],
      },
    },
  },
  
  // Handle environment variables properly
  envPrefix: ['VITE_', 'REACT_APP_'],
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  }
}); 