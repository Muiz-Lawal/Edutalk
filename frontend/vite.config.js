import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Optimize bundle size
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-stripe': ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          'vendor-charts': ['recharts'],
          'vendor-video': ['hls.js'],
          'vendor-other': ['axios', 'socket.io-client'],
        },
      },
    },
    
    // Performance hints
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
    cssCodeSplit: true,
    sourcemap: false, // Disable source maps in production
    reportCompressed: true,
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      '@stripe/react-stripe-js',
      'recharts',
      'hls.js',
    ],
  },
})
