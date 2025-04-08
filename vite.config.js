import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'buffer': 'buffer/',
      'process': 'process/browser',
    },
  },
  // Force using CommonJS module format for postcss
  css: {
    postcss: './postcss.config.cjs',
  },
  // Define global variables for browser environment
  define: {
    global: 'globalThis',
    'process.env': process.env,
  },
  // Ensure proper handling of dashboard component
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'buffer',
      'process/browser',
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
    force: true
  },
  // Handle Node.js polyfills
  build: {
    rollupOptions: {
      plugins: [
        // Polyfill Node.js built-ins
      ],
    },
  },
  // Clear cache on startup
  cacheDir: '.vite',
  clearScreen: true
}); 