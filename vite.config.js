import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer
      ],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
    },
  },
  cacheDir: '.vite',
  clearScreen: true,
  
  // Add build configuration for cache busting with content hashing
  build: {
    // Generate sourcemaps for better debugging
    sourcemap: true,
    
    // Configure Rollup options
    rollupOptions: {
      output: {
        // Use content hashing for all file types
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        
        // Separate vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Add other common dependencies as needed
        }
      }
    },
    
    // Ensure assets use content hashing
    assetsInlineLimit: 4096, // Only inline assets smaller than 4kb
    
    // Clean the output directory before building
    emptyOutDir: true
  }
}); 