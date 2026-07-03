// Hook for managing notifications and service worker
import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [notifications, setNotifications] = useState([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result === 'granted';
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(async (title, options = {}) => {
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const notificationData = {
        title,
        ...options,
        badge: '/icons/logo-192.png',
        icon: '/icons/logo-192.png',
      };

      await registration.showNotification(title, notificationData);

      // Store notification locally
      const notification = {
        id: Date.now(),
        title,
        options: notificationData,
        timestamp: new Date(),
      };
      setNotifications(prev => [notification, ...prev].slice(0, 50));

      return notification;
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  }, [permission]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    permission,
    notifications,
    isSupported,
    requestPermission,
    sendNotification,
    clearNotifications,
  };
};
