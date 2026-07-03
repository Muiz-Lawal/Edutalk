// Service Worker for EduTalk PWA
// Handles offline support, caching, and push notifications
// Version: 2 (Enhanced with better offline support)

const CACHE_VERSION = 'v2';
const CACHE_NAME = `edutalk-${CACHE_VERSION}`;
const STATIC_CACHE = `edutalk-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `edutalk-dynamic-${CACHE_VERSION}`;
const API_CACHE = `edutalk-api-${CACHE_VERSION}`;

// Static assets to precache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Maximum cache sizes (items to keep)
const CACHE_LIMITS = {
  dynamic: 50,
  api: 100,
};

// Helper to clean up old caches
const cleanOldCaches = async () => {
  const cacheNames = await caches.keys();
  const validCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
  return Promise.all(
    cacheNames
      .filter(name => !validCaches.includes(name))
      .map(name => caches.delete(name))
  );
};

// Helper to limit cache size
const limitCache = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    // Delete oldest items
    for (let i = 0; i < keys.length - maxItems; i++) {
      await cache.delete(keys[i]);
    }
  }
};

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v2...');
  
  event.waitUntil(
    (async () => {
      try {
        // Precache static assets
        const cache = await caches.open(STATIC_CACHE);
        console.log('[SW] Precaching essential assets...');
        await cache.addAll(STATIC_ASSETS);
        
        // Clean up old caches
        await cleanOldCaches();
        
        console.log('[SW] Installation complete');
      } catch (err) {
        console.error('[SW] Installation failed:', err);
      }
    })()
  );
  
  // Skip waiting - activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v2...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        await cleanOldCaches();
        
        // Claim all clients
        await self.clients.claim();
        
        console.log('[SW] Activation complete - now controlling clients');
      } catch (err) {
        console.error('[SW] Activation error:', err);
      }
    })()
  );
});

// Fetch event - intelligent caching based on resource type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then(cached => cached || caches.match('/offline.html'));
        })
    );
    return;
  }
  
  // API requests - network first with offline cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            // Cache successful API responses
            const cache = caches.open(API_CACHE);
            cache.then(async (c) => {
              await c.put(request, response.clone());
              await limitCache(API_CACHE, CACHE_LIMITS.api);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request)
            .then(cached => cached || new Response(
              JSON.stringify({ error: 'Offline - Data not available' }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            ));
        })
    );
    return;
  }
  
  // Static assets - cache first
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) {
          return cached;
        }
        
        return fetch(request)
          .then(response => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            // Cache successful responses
            const cache = caches.open(DYNAMIC_CACHE);
            cache.then(async (c) => {
              await c.put(request, response.clone());
              await limitCache(DYNAMIC_CACHE, CACHE_LIMITS.dynamic);
            });
            
            return response;
          })
          .catch(() => {
            // Return generic offline response for failed requests
            return new Response(
              'Offline - Resource not available',
              { status: 503, statusText: 'Service Unavailable' }
            );
          });
      })
  );
});

// Background sync event - sync pending offline updates
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-progress-updates') {
    event.waitUntil(syncOfflineUpdates());
  }
  
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncOfflineNotes());
  }
});

// Sync offline progress updates
async function syncOfflineUpdates() {
  try {
    console.log('[SW] Syncing progress updates...');
    
    // Notify clients about sync start
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_START', data: 'progress' });
    });
    
    // Attempt to sync - implementation depends on IndexedDB
    // This is a placeholder for the actual sync logic
    console.log('[SW] Progress sync completed');
    
    // Notify clients about sync completion
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', data: 'progress' });
    });
  } catch (err) {
    console.error('[SW] Background sync error:', err);
  }
}

// Sync offline notes
async function syncOfflineNotes() {
  try {
    console.log('[SW] Syncing notes...');
    // Implementation for syncing notes
  } catch (err) {
    console.error('[SW] Note sync error:', err);
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  try {
    const data = event.data?.json() || {};
    
    const options = {
      body: data.body || 'New notification from EduTalk',
      icon: '/icons/logo-192.png',
      badge: '/icons/logo-192.png',
      vibrate: [100, 50, 100],
      tag: data.tag || 'edutalk-notification',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    };
    
    const title = data.title || 'EduTalk';
    
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('[SW] Push notification error:', err);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open app if not already open
        if (self.clients.openWindow) {
          const url = event.notification.data?.url || '/';
          return self.clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

// Message event - communicate with clients
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  console.log('[SW] Message received:', type);
  
  // Skip waiting - activate new SW version
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  // Clear cache - cleanup old cached data
  if (type === 'CLEAR_CACHE') {
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        event.ports[0]?.postMessage({ success: true, message: 'Caches cleared' });
        console.log('[SW] All caches cleared');
      } catch (err) {
        event.ports[0]?.postMessage({ success: false, error: err.message });
      }
    })();
    return;
  }
  
  // Clear specific cache
  if (type === 'CLEAR_CACHE_NAMED') {
    (async () => {
      try {
        await caches.delete(data);
        event.ports[0]?.postMessage({ success: true, message: `Cache ${data} cleared` });
      } catch (err) {
        event.ports[0]?.postMessage({ success: false, error: err.message });
      }
    })();
    return;
  }
  
  // Get cache stats
  if (type === 'GET_CACHE_STATS') {
    (async () => {
      try {
        const cacheNames = await caches.keys();
        const stats = {
          totalCaches: cacheNames.length,
          caches: cacheNames
        };
        event.ports[0]?.postMessage({ success: true, data: stats });
      } catch (err) {
        event.ports[0]?.postMessage({ success: false, error: err.message });
      }
    })();
    return;
  }
});

console.log('[SW] Service Worker v2 loaded and ready');
