// Testing utilities for PWA features and performance
// Import with: import { testAllFeatures } from './testHelpers';

export const testHelpers = {
  /**
   * Detect browser PWA capabilities
   */
  detectCapabilities: () => {
    const capabilities = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      indexedDB: 'indexedDB' in window,
      localStorage: 'localStorage' in window,
      cacheAPI: 'caches' in window,
      periodicSync: 'periodicSync' in ServiceWorkerRegistration?.prototype || false,
      backgroundSync: 'sync' in ServiceWorkerRegistration?.prototype || false,
      sharedStorage: 'sharedStorage' in window,
    };

    return capabilities;
  },

  /**
   * Get browser info
   */
  getBrowserInfo: () => {
    const ua = navigator.userAgent;
    return {
      userAgent: ua,
      isChrome: /Chrome/.test(ua) && !/Chromium/.test(ua),
      isChromium: /Chromium/.test(ua),
      isFirefox: /Firefox/.test(ua),
      isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
      isEdge: /Edg/.test(ua),
      isOpera: /OPR/.test(ua),
      isMobile: /Mobile/.test(ua),
      isTablet: /Tablet/.test(ua),
      isIOS: /iPhone|iPad/.test(ua),
      isAndroid: /Android/.test(ua),
      isWindows: /Windows/.test(ua),
      isMac: /Macintosh/.test(ua),
      isLinux: /Linux/.test(ua),
    };
  },

  /**
   * Test API endpoints
   */
  testAPIEndpoints: async () => {
    const endpoints = [
      { method: 'GET', path: '/api/auth/profile', requiresAuth: true },
      { method: 'GET', path: '/api/classes', requiresAuth: false },
      { method: 'GET', path: '/api/push/subscriptions', requiresAuth: true },
    ];

    const results = [];
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(
          `http://localhost:5000${endpoint.path}`
        );
        results.push({
          endpoint: endpoint.path,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        });
      } catch (error) {
        results.push({
          endpoint: endpoint.path,
          error: error.message,
          status: 'FAILED',
        });
      }
    }

    return results;
  },

  /**
   * Measure performance metrics
   */
  measurePerformance: () => {
    const metrics = {
      navigationTiming: {},
      resourceTiming: [],
      memoryUsage: {},
    };

    // Navigation timing
    if (performance.timing) {
      const timing = performance.timing;
      metrics.navigationTiming = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domParse: timing.domComplete - timing.domLoading,
        dcl: timing.domContentLoadedEventEnd - timing.navigationStart,
        load: timing.loadEventEnd - timing.navigationStart,
      };
    }

    // Resource timing (first 10)
    if (performance.getEntriesByType) {
      metrics.resourceTiming = performance
        .getEntriesByType('resource')
        .slice(0, 10)
        .map((r) => ({
          name: r.name.split('/').pop(),
          duration: Math.round(r.duration),
          size: r.transferSize || 0,
        }));
    }

    // Memory usage (if available)
    if (performance.memory) {
      metrics.memoryUsage = {
        usedJSHeapSize: Math.round(
          performance.memory.usedJSHeapSize / 1024 / 1024
        ),
        totalJSHeapSize: Math.round(
          performance.memory.totalJSHeapSize / 1024 / 1024
        ),
        jsHeapSizeLimit: Math.round(
          performance.memory.jsHeapSizeLimit / 1024 / 1024
        ),
      };
    }

    return metrics;
  },

  /**
   * Test Service Worker installation
   */
  testServiceWorker: async () => {
    if (!('serviceWorker' in navigator)) {
      return { installed: false, error: 'Service Worker not supported' };
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        installed: !!registration,
        active: registration?.active ? true : false,
        scope: registration?.scope || 'N/A',
        updateViaCache:
          registration?.updateViaCache || 'N/A',
      };
    } catch (error) {
      return { installed: false, error: error.message };
    }
  },

  /**
   * Test cache storage
   */
  testCacheStorage: async () => {
    if (!('caches' in window)) {
      return { available: false, error: 'Cache API not supported' };
    }

    try {
      const cacheNames = await caches.keys();
      const cacheDetails = [];

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        cacheDetails.push({
          name,
          itemCount: requests.length,
          items: requests.slice(0, 5).map((r) => r.url.split('/').pop()),
        });
      }

      return {
        available: true,
        cacheCount: cacheNames.length,
        caches: cacheDetails,
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  },

  /**
   * Test IndexedDB storage
   */
  testIndexedDB: async () => {
    if (!('indexedDB' in window)) {
      return { available: false, error: 'IndexedDB not supported' };
    }

    try {
      const dbs = await indexedDB.databases?.();
      return {
        available: true,
        databaseCount: dbs?.length || 0,
        databases: dbs?.map((db) => db.name) || [],
      };
    } catch (error) {
      return { available: false, error: error.message };
    }
  },

  /**
   * Test notification permission
   */
  testNotificationPermission: () => {
    if (!('Notification' in window)) {
      return {
        supported: false,
        error: 'Notification API not supported',
      };
    }

    return {
      supported: true,
      permission: Notification.permission,
      canRequest:
        Notification.permission === 'default',
    };
  },

  /**
   * Run all tests
   */
  runAllTests: async () => {
    console.log('🧪 Starting PWA Feature Tests...\n');

    const results = {
      timestamp: new Date().toISOString(),
      browser: testHelpers.getBrowserInfo(),
      capabilities: testHelpers.detectCapabilities(),
      serviceWorker: await testHelpers.testServiceWorker(),
      cacheStorage: await testHelpers.testCacheStorage(),
      indexedDB: await testHelpers.testIndexedDB(),
      notifications: testHelpers.testNotificationPermission(),
      performance: testHelpers.measurePerformance(),
      endpoints: await testHelpers.testAPIEndpoints(),
    };

    console.log('✅ Test Results:');
    console.table(results);

    return results;
  },

  /**
   * Log results in human-readable format
   */
  logResults: (results) => {
    console.log('\n📊 PWA Feature Test Results\n');
    console.log('Browser:', results.browser);
    console.log('\nCapabilities:');
    Object.entries(results.capabilities).forEach(([key, value]) => {
      console.log(`  ${key}: ${value ? '✅' : '❌'}`);
    });

    console.log('\nService Worker:', results.serviceWorker);
    console.log('Cache Storage:', results.cacheStorage);
    console.log('IndexedDB:', results.indexedDB);
    console.log('Notifications:', results.notifications);

    console.log('\nPerformance Metrics:');
    if (results.performance.navigationTiming) {
      Object.entries(results.performance.navigationTiming).forEach(
        ([key, value]) => {
          console.log(`  ${key}: ${Math.round(value)}ms`);
        }
      );
    }

    if (results.performance.memoryUsage.usedJSHeapSize) {
      console.log(
        `  Memory Usage: ${results.performance.memoryUsage.usedJSHeapSize}MB / ${results.performance.memoryUsage.totalJSHeapSize}MB`
      );
    }

    console.log('\nAPI Endpoints:');
    results.endpoints.forEach((endpoint) => {
      const status = endpoint.ok ? '✅' : '❌';
      console.log(
        `  ${status} ${endpoint.endpoint}: ${endpoint.status || endpoint.error}`
      );
    });
  },
};

// For quick testing, export individual functions
export const {
  detectCapabilities,
  getBrowserInfo,
  testAPIEndpoints,
  measurePerformance,
  testServiceWorker,
  testCacheStorage,
  testIndexedDB,
  testNotificationPermission,
  runAllTests,
  logResults,
} = testHelpers;

// Usage in browser console:
// import { runAllTests, logResults } from './testHelpers';
// const results = await runAllTests();
// logResults(results);
