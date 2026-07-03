import { useEffect, useState, useCallback } from 'react';

export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    // Check if service workers are supported
    const supported = 'serviceWorker' in navigator;
    setIsSupported(supported);

    let updateIntervalId = null;

    if (!supported) return;

    // Register service worker
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[App] Service Worker registered:', reg.scope);
        setRegistration(reg);
        setIsReady(true);

        // Check for updates periodically only in production to avoid dev-server noise
        if (import.meta.env.PROD) {
          updateIntervalId = window.setInterval(() => {
            reg.update().catch(() => {});
          }, 60000);
        }

        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          console.log('[App] New Service Worker installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('[App] New Service Worker activated');
              setUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => {
        console.error('[App] Service Worker registration failed:', err);
        setIsReady(false);
      });

    // Listen for controller change (SW update applied)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[App] Service Worker controller changed (update applied)');
      setUpdateAvailable(false);
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, data } = event.data;
      console.log('[App] Message from SW:', type);

      if (type === 'SYNC_START') {
        console.log('[App] Starting sync:', data);
      }

      if (type === 'SYNC_COMPLETE') {
        console.log('[App] Sync complete:', data);
      }
    });

    return () => {
      if (updateIntervalId) {
        window.clearInterval(updateIntervalId);
      }
    };
  }, []);

  // Skip waiting - immediately activate new SW version
  const skipWaiting = useCallback(() => {
    if (!registration?.waiting) return;

    console.log('[App] Requesting SW to skip waiting...');
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }, [registration]);

  // Clear all caches
  const clearCache = useCallback(async () => {
    if (!isReady) {
      console.error('[App] Service Worker not ready');
      return false;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        console.log('[App] Cache clear response:', event.data);
        resolve(event.data.success);
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' },
          [channel.port2]
        );
      }
    });
  }, [isReady]);

  // Clear specific cache
  const clearNamedCache = useCallback(async (cacheName) => {
    if (!isReady) {
      console.error('[App] Service Worker not ready');
      return false;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        console.log('[App] Named cache clear response:', event.data);
        resolve(event.data.success);
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE_NAMED', data: cacheName },
          [channel.port2]
        );
      }
    });
  }, [isReady]);

  // Get cache statistics
  const getCacheStats = useCallback(async () => {
    if (!isReady) {
      console.error('[App] Service Worker not ready');
      return null;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        console.log('[App] Cache stats:', event.data);
        resolve(event.data.data);
      };

      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATS' },
          [channel.port2]
        );
      }
    });
  }, [isReady]);

  // Trigger background sync
  const triggerSync = useCallback(async (tag) => {
    if (!isReady || !registration) {
      console.error('[App] Service Worker not ready');
      return false;
    }

    try {
      await registration.sync.register(tag);
      console.log('[App] Background sync registered:', tag);
      return true;
    } catch (err) {
      console.error('[App] Background sync failed:', err);
      return false;
    }
  }, [isReady, registration]);

  return {
    isSupported,
    isReady,
    isUpdating,
    updateAvailable,
    registration,
    skipWaiting,
    clearCache,
    clearNamedCache,
    getCacheStats,
    triggerSync,
  };
};

export default useServiceWorker;
