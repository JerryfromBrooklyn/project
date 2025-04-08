import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Force using CommonJS module format for postcss
  css: {
    postcss: './postcss.config.cjs',
  },
  // Ensure proper handling of dashboard component
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true
  },
  // Clear cache on startup
  cacheDir: '.vite',
  clearScreen: true
}); 