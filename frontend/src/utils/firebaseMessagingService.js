/**
 * Firebase Cloud Messaging Service for Push Notifications
 * Works with both React Native and PWA
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

let messaging = null;

export const initializeFirebaseMessaging = async () => {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.projectId) {
      console.warn('Firebase config incomplete - skipping initialization');
      return null;
    }

    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);

    console.log('✓ Firebase Messaging initialized');
    return messaging;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
};

export const getFirebaseToken = async () => {
  try {
    if (!messaging) {
      await initializeFirebaseMessaging();
    }

    if (!messaging) return null;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token) {
      console.log('✓ Firebase FCM token obtained');
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const setupMessageListener = (onMessageCallback) => {
  try {
    if (!messaging) {
      console.warn('Firebase Messaging not initialized');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);

      if (onMessageCallback) {
        onMessageCallback(payload);
      }

      if (payload.notification) {
        new Notification(payload.notification.title || 'EduTalk', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          data: payload.data,
        });
      }
    });

    console.log('✓ Message listener set up');
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
};

export const firebaseMessagingService = {
  async initialize() {
    return await initializeFirebaseMessaging();
  },

  async requestPermission() {
    try {
      if (!('Notification' in window)) return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  },

  async getToken() {
    return await getFirebaseToken();
  },

  setupListener(callback) {
    return setupMessageListener(callback);
  },
};
