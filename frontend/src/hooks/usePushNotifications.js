import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import api from '../utils/api';

export const usePushNotifications = () => {
  const { isAuthenticated } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if Push Notifications are supported
  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;
    setIsSupported(supported);
  }, []);

  // Check current subscription status
  useEffect(() => {
    if (!isSupported || !isAuthenticated) {
      return;
    }

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
        setIsSubscribed(!!sub);
      } catch (err) {
        console.error('Error checking subscription:', err);
        setError(err.message);
      }
    };

    checkSubscription();
  }, [isSupported, isAuthenticated]);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError(err.message);
      return false;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!isSupported || !isAuthenticated) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check Notification permission
      const permission = Notification.permission;
      if (permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setError('Permission denied');
          setIsLoading(false);
          return false;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error('VITE_VAPID_PUBLIC_KEY is not configured');
      }

      // Check if already subscribed
      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        // Subscribe to push
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertVapidKey(vapidPublicKey),
        });
      }

      // Send subscription to server
      await api.post('/push/subscribe', {
        subscription: sub.toJSON(),
      });

      setSubscription(sub);
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Subscribe error:', err);
      setError(err.message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, isAuthenticated, requestPermission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!isSupported || !subscription) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send unsubscribe request to server
      await api.post('/push/unsubscribe', {
        subscription: subscription.toJSON(),
      });

      // Unsubscribe from push
      await subscription.unsubscribe();

      setSubscription(null);
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Unsubscribe error:', err);
      setError(err.message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, subscription]);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!isAuthenticated) {
      return false;
    }

    try {
      await api.post('/push/send-test');
      return true;
    } catch (err) {
      console.error('Test notification error:', err);
      setError(err.message);
      return false;
    }
  }, [isAuthenticated]);

  return {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
};

// Convert VAPID public key from base64 to Uint8Array
function convertVapidKey(vapidPublicKey) {
  if (!vapidPublicKey) {
    console.error('VAPID_PUBLIC_KEY not set in environment');
    return new Uint8Array();
  }

  const padding = 4 - (vapidPublicKey.length % 4);
  const paddedKey =
    vapidPublicKey +
    (padding !== 4 ? '='.repeat(padding) : '');

  const binaryString = atob(paddedKey);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
}
