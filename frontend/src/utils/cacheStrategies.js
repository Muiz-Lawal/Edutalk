/**
 * Cache-first strategy: Return cached response if available, fall back to network
 */
export const cacheFirst = async (request, cacheName) => {
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
    console.error('Cache-first strategy failed:', error);
    return new Response('Offline - cached content unavailable', { status: 503 });
  }
};

/**
 * Network-first strategy: Try network first, fall back to cache
 */
export const networkFirst = async (request, cacheName) => {
  try {
    const response = await fetch(request);
    if (!response || response.status !== 200) {
      return response;
    }
    
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('Network-first strategy failed:', error);
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - no cached version available', { status: 503 });
  }
};

/**
 * Stale-while-revalidate strategy: Return cached immediately, update in background
 */
export const staleWhileRevalidate = async (request, cacheName) => {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (!response || response.status !== 200) {
      return response;
    }
    
    const cache = caches.open(cacheName).then((c) => {
      c.put(request, response.clone());
      return response;
    });
    
    return cache;
  }).catch((error) => {
    console.error('Stale-while-revalidate fetch failed:', error);
    return cached;
  });
  
  return cached || fetchPromise;
};

export const cacheStrategies = {
  cacheFirst,
  networkFirst,
  staleWhileRevalidate,
};
