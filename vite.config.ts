import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // This ensures better HMR and faster builds
      fastRefresh: true,
      // Include runtime JSX transform
      jsxRuntime: 'automatic',
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    hmr: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Improve build performance
    target: 'esnext',
    // Reduce chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'aws-vendor': ['@aws-sdk/client-rekognition', '@aws-sdk/client-s3'],
          'ui-vendor': ['framer-motion', 'lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
    ],
  },
  // Let Vite automatically detect postcss.config.cjs
  // css: {
  //   postcss: './postcss.config.cjs'
  // }
})