/**
 * Push Notification Handler
 * Handles incoming notifications on web and mobile platforms
 * Routes notifications to appropriate screens/actions
 */

import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { deepLinkingConfig } from './deepLinkingConfig';

const NOTIFICATION_TASK_NAME = 'HANDLE_NOTIFICATION_EVENT';

/**
 * Parse deep link from notification
 */
export const parseNotificationLink = (data) => {
  if (!data) return null;

  const { link, screen, params } = data;

  if (link) {
    return deepLinkingConfig.parsing.parseDeepLink(link);
  }

  if (screen) {
    return {
      name: screen,
      params: params ? JSON.parse(typeof params === 'string' ? params : JSON.stringify(params)) : {},
    };
  }

  return null;
};

/**
 * Background notification handler (Expo)
 */
export const setupBackgroundNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const { data } = notification.request.content;

      // Log notification
      console.log('Background notification received:', data);

      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      };
    },
  });
};

/**
 * Foreground notification handler
 */
export const setupForegroundNotificationHandler = (navigationRef) => {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      const { data, title, body } = notification.request.content;

      console.log('Foreground notification received:', {
        title,
        body,
        data,
      });

      // Handle notification-specific actions
      handleNotificationAction(notification, navigationRef, data);
    }
  );

  return notificationListener;
};

/**
 * Notification response listener (when user taps notification)
 */
export const setupNotificationResponseListener = (navigationRef) => {
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const { notification } = response;
      const { data, title, body } = notification.request.content;

      console.log('Notification response:', {
        title,
        body,
        data,
      });

      // Parse and navigate
      const routeData = parseNotificationLink(data);
      if (routeData && navigationRef?.current) {
        navigationRef.current.navigate(routeData.name, routeData.params);
      }

      // Track analytics
      trackNotificationEvent('notification_tapped', { title, body });
    }
  );

  return responseListener;
};

/**
 * Handle notification-specific actions
 */
const handleNotificationAction = (notification, navigationRef, data) => {
  const { title, body } = notification.request.content;

  // Different handling based on notification type
  if (data?.type === 'class_started') {
    // Join class automatically in some cases
    if (data?.classId && navigationRef?.current) {
      navigationRef.current.navigate('LiveStream', {
        classId: data.classId,
      });
    }
  } else if (data?.type === 'payment_received') {
    // Navigate to earnings
    if (navigationRef?.current) {
      navigationRef.current.navigate('Earnings');
    }
  } else if (data?.type === 'new_message') {
    // Navigate to chat
    if (data?.chatId && navigationRef?.current) {
      navigationRef.current.navigate('Chat', {
        chatId: data.chatId,
      });
    }
  }
};

/**
 * Request notification permissions (iOS)
 */
export const requestNotificationPermissions = async () => {
  try {
    const { granted } = await Notifications.requestPermissionsAsync();
    return granted;
  } catch (error) {
    console.error('Request notification permissions error:', error);
    return false;
  }
};

/**
 * Get notification settings
 */
export const getNotificationSettings = async () => {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings;
  } catch (error) {
    console.error('Get notification settings error:', error);
    return null;
  }
};

/**
 * Send local notification (for testing)
 */
export const sendLocalNotification = (title, body, data = {}) => {
  try {
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        badge: 1,
      },
      trigger: { seconds: 2 },
    });
  } catch (error) {
    console.error('Send local notification error:', error);
  }
};

/**
 * Cancel all notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Cancel notifications error:', error);
  }
};

/**
 * Set up background notification task (for receiving when app is closed)
 */
export const setupBackgroundNotificationTask = () => {
  TaskManager.defineTask(NOTIFICATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
      console.error('Background task error:', error);
      return;
    }

    if (data) {
      console.log('Background notification task received:', data);
      // Handle background notification
      trackNotificationEvent('notification_received_background', data);
    }
  });
};

/**
 * Analytics: Track notification events
 */
const trackNotificationEvent = (eventName, data) => {
  try {
    // Send to analytics service
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.getItem('analytics_queue').then(queue => {
      const events = queue ? JSON.parse(queue) : [];
      events.push({
        event: eventName,
        timestamp: Date.now(),
        data,
      });
      AsyncStorage.setItem('analytics_queue', JSON.stringify(events));
    });
  } catch (error) {
    console.error('Track notification event error:', error);
  }
};

/**
 * Format notification payload for sending from backend
 */
export const createNotificationPayload = ({
  title,
  body,
  type = 'info',
  screen,
  params = {},
  data = {},
}) => {
  return {
    notification: {
      title,
      body,
    },
    data: {
      type,
      screen,
      params: JSON.stringify(params),
      ...data,
    },
  };
};

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  CLASS_STARTED: 'class_started',
  CLASS_ENDED: 'class_ended',
  NEW_MESSAGE: 'new_message',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_FAILED: 'payment_failed',
  ENROLLMENT_CONFIRMED: 'enrollment_confirmed',
  RECORDING_READY: 'recording_ready',
  SCHEDULE_REMINDER: 'schedule_reminder',
  ADMIN_ALERT: 'admin_alert',
  SYSTEM_MAINTENANCE: 'system_maintenance',
};

/**
 * Notification channels (Android)
 */
export const setupNotificationChannels = async () => {
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('alerts', {
      name: 'Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FF0000',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00FF00',
    });
  } catch (error) {
    console.error('Setup notification channels error:', error);
  }
};

/**
 * Web platform: Handle service worker notifications
 */
export const setupWebNotificationHandler = () => {
  if ('serviceWorkerContainer' in navigator) {
    navigator.serviceWorkerContainer.addEventListener('message', (event) => {
      const { type, notification } = event.data;

      if (type === 'NOTIFICATION_RECEIVED') {
        console.log('Web notification received:', notification);

        // Handle notification
        handleWebNotification(notification);
      }
    });
  }
};

/**
 * Handle web notifications
 */
const handleWebNotification = (notification) => {
  const { title, tag, data } = notification;

  // Log for analytics
  trackNotificationEvent('web_notification_received', {
    title,
    tag,
    data,
  });

  // Can add more custom handling here
};

/**
 * Initialize all notification handlers
 */
export const initializeNotificationHandlers = (navigationRef) => {
  try {
    // Mobile
    if (typeof window !== 'undefined') {
      setupBackgroundNotificationHandler();
      setupForegroundNotificationHandler(navigationRef);
      setupNotificationResponseListener(navigationRef);
      setupNotificationChannels();
    }

    // Web
    setupWebNotificationHandler();

    return {
      requestPermissions: requestNotificationPermissions,
      sendLocal: sendLocalNotification,
      cancelAll: cancelAllNotifications,
    };
  } catch (error) {
    console.error('Initialize notification handlers error:', error);
    return null;
  }
};

export default {
  parseNotificationLink,
  setupBackgroundNotificationHandler,
  setupForegroundNotificationHandler,
  setupNotificationResponseListener,
  requestNotificationPermissions,
  getNotificationSettings,
  sendLocalNotification,
  cancelAllNotifications,
  setupBackgroundNotificationTask,
  createNotificationPayload,
  NOTIFICATION_TYPES,
  setupNotificationChannels,
  setupWebNotificationHandler,
  initializeNotificationHandlers,
};
