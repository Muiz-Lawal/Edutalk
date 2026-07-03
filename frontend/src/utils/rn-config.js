/**
 * React Native Configuration Setup
 * Configuration and initialization for React Native app
 */

import { Platform } from 'react-native';

export const config = {
  // API Configuration
  api: {
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'X-Client': 'edutalk-mobile/1.0',
    },
  },

  // Firebase Configuration
  firebase: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  },

  // Stripe Configuration
  stripe: {
    publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  },

  // Video Configuration
  video: {
    defaultQuality: '720p',
    qualityLevels: ['360p', '480p', '720p', '1080p'],
    defaultBitrate: {
      '360p': 500,
      '480p': 1000,
      '720p': 2500,
      '1080p': 5000,
    },
  },

  // Storage Configuration
  storage: {
    offlineCacheLimit: 500 * 1024 * 1024, // 500 MB
    imageCacheLimit: 100 * 1024 * 1024, // 100 MB
  },

  // Network Configuration
  network: {
    timeout: 15000,
    retryCount: 3,
    retryDelay: 1000,
    enableAutoSync: true,
    syncInterval: 30000, // 30 seconds
  },

  // Notification Configuration
  notifications: {
    enabled: true,
    channels: {
      default: {
        name: 'Default',
        description: 'Default notification channel',
      },
      reminders: {
        name: 'Reminders',
        description: 'Class reminders and notifications',
      },
      messages: {
        name: 'Messages',
        description: 'Messages and chat notifications',
      },
    },
  },

  // App Configuration
  app: {
    name: 'EduTalk',
    version: '1.0.0',
    buildNumber: 1,
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV === 'development',
  },

  // Platform-specific Configuration
  platform: {
    isAndroid: Platform.OS === 'android',
    isIOS: Platform.OS === 'ios',
    isWeb: Platform.OS === 'web',
  },

  // Feature Flags
  features: {
    offlineMode: true,
    pushNotifications: true,
    videoStreaming: true,
    deepLinking: true,
    backgroundSync: true,
    imageOptimization: true,
  },
};

/**
 * Validate configuration
 */
export const validateConfig = () => {
  const errors = [];

  // Check API URL
  if (!config.api.baseURL) {
    errors.push('API base URL not configured');
  }

  // Check Firebase if enabled
  if (config.features.pushNotifications && !config.firebase.projectId) {
    errors.push('Firebase not configured for push notifications');
  }

  // Check Stripe if payment enabled
  if (!config.stripe.publishableKey) {
    console.warn('Stripe not configured - payments may not work');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    return false;
  }

  console.log('✓ Configuration validated');
  return true;
};

/**
 * Get environment-specific config
 */
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') {
    return {
      ...config,
      app: { ...config.app, debug: false },
      api: { ...config.api, timeout: 20000 },
    };
  }

  return config;
};

export default config;
