import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.webmanifest',
      includeAssets: [
        'vite.svg',
        'icons/logo-192.png',
        'icons/logo-512.png',
        'icons/logo-192-maskable.png',
        'icons/logo-512-maskable.png',
        'icons/logo-192.svg',
        'icons/logo-512.svg',
      ],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2}'],
        globIgnores: ['**/sw.js', '**/workbox-*.js'],
      },
      manifest: {
        name: 'EduTalk — Live classes',
        short_name: 'EduTalk',
        description: 'Join live classes on EduTalk.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#4F46E5',
        background_color: '#F8FAFC',
        icons: [
          {
            src: '/icons/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/logo-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/logo-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
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
