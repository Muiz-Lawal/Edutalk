const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
};

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  console.log('✓ Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('✓ Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('Some assets could not be cached:', error);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('✓ Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !Object.values(CACHE_NAMES).includes(name))
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls: network-first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request, CACHE_NAMES.dynamic));
  }
  // Images: cache-first
  else if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
  }
  // Static assets: cache-first
  else {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  }
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (!response || response.status !== 200) {
      return response;
    }
    
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('Network request failed:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - no cached version available', { status: 503 });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (!response || response.status !== 200) {
      return response;
    }
    
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    return new Response('Offline - cached content unavailable', { status: 503 });
  }
}
