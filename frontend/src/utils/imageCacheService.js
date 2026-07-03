/**
 * Image Caching Service
 * Handles caching of images across web and mobile platforms
 * Uses Cache API for web, AsyncStorage for React Native
 */

const CACHE_NAME = 'edutalk-images-v1';
const IMAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50 MB
const STORAGE_KEY_PREFIX = 'img_cache_';

/**
 * Cache metadata structure
 * {
 *   url: string,
 *   timestamp: number,
 *   size: number,
 *   headers: object
 * }
 */

/**
 * Platform detection
 */
const isReactNative = () => {
  return typeof global !== 'undefined' && 
         global.__DEV__ !== undefined &&
         !window.document;
};

/**
 * Web platform: Cache API
 */
const webImageCache = {
  async get(url) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(url);
      
      if (response) {
        const metadata = await this.getMetadata(url);
        if (metadata && this.isExpired(metadata.timestamp)) {
          await this.remove(url);
          return null;
        }
        return response;
      }
      return null;
    } catch (error) {
      console.error('Image cache get error:', error);
      return null;
    }
  },

  async set(url, blob, headers = {}) {
    try {
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(blob, {
        headers: {
          'Content-Type': headers['content-type'] || 'image/jpeg',
          'Cache-Control': 'public, max-age=2592000'
        }
      });
      
      await cache.put(url, response);
      
      // Store metadata
      const metadata = {
        url,
        timestamp: Date.now(),
        size: blob.size,
        headers
      };
      await this.saveMetadata(url, metadata);
      
      // Enforce size limit
      await this.enforceStorageLimit();
      
      return true;
    } catch (error) {
      console.error('Image cache set error:', error);
      return false;
    }
  },

  async remove(url) {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.delete(url);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${this.hashUrl(url)}`);
      return true;
    } catch (error) {
      console.error('Image cache remove error:', error);
      return false;
    }
  },

  async clear() {
    try {
      await caches.delete(CACHE_NAME);
      // Clear metadata
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Image cache clear error:', error);
      return false;
    }
  },

  async getMetadata(url) {
    const key = `${STORAGE_KEY_PREFIX}${this.hashUrl(url)}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  async saveMetadata(url, metadata) {
    const key = `${STORAGE_KEY_PREFIX}${this.hashUrl(url)}`;
    localStorage.setItem(key, JSON.stringify(metadata));
  },

  async enforceStorageLimit() {
    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      let totalSize = 0;
      const entries = [];

      // Calculate total size and get all entries
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          entries.push({
            url: request.url,
            size: blob.size,
            timestamp: (await this.getMetadata(request.url))?.timestamp || 0
          });
          totalSize += blob.size;
        }
      }

      // Remove old entries if over limit
      if (totalSize > MAX_CACHE_SIZE) {
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        for (const entry of entries) {
          if (totalSize <= MAX_CACHE_SIZE * 0.9) break; // Stop at 90% of limit
          await cache.delete(entry.url);
          localStorage.removeItem(`${STORAGE_KEY_PREFIX}${this.hashUrl(entry.url)}`);
          totalSize -= entry.size;
        }
      }
    } catch (error) {
      console.error('Storage limit enforcement error:', error);
    }
  },

  hashUrl(url) {
    // Simple hash for URL storage key
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  },

  isExpired(timestamp) {
    return Date.now() - timestamp > IMAGE_CACHE_TTL;
  }
};

/**
 * React Native platform: AsyncStorage
 */
const reactNativeImageCache = {
  async get(url) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const key = `${STORAGE_KEY_PREFIX}${this.hashUrl(url)}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const metadata = JSON.parse(data);
        if (this.isExpired(metadata.timestamp)) {
          await this.remove(url);
          return null;
        }
        return {
          data: metadata.data,
          metadata
        };
      }
      return null;
    } catch (error) {
      console.error('RN image cache get error:', error);
      return null;
    }
  },

  async set(url, blob, headers = {}) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // Convert blob to base64
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1];
          const metadata = {
            url,
            timestamp: Date.now(),
            size: blob.size,
            data: base64,
            headers
          };
          
          const key = `${STORAGE_KEY_PREFIX}${this.hashUrl(url)}`;
          await AsyncStorage.setItem(key, JSON.stringify(metadata));
          
          // Enforce size limit
          await this.enforceStorageLimit();
          
          resolve(true);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('RN image cache set error:', error);
      return false;
    }
  },

  async remove(url) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const key = `${STORAGE_KEY_PREFIX}${this.hashUrl(url)}`;
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('RN image cache remove error:', error);
      return false;
    }
  },

  async clear() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const cachingKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      await AsyncStorage.multiRemove(cachingKeys);
      return true;
    } catch (error) {
      console.error('RN image cache clear error:', error);
      return false;
    }
  },

  async enforceStorageLimit() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));
      
      let totalSize = 0;
      const entries = [];

      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const metadata = JSON.parse(data);
          entries.push({
            key,
            size: metadata.size,
            timestamp: metadata.timestamp
          });
          totalSize += metadata.size;
        }
      }

      if (totalSize > MAX_CACHE_SIZE) {
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        for (const entry of entries) {
          if (totalSize <= MAX_CACHE_SIZE * 0.9) break;
          await AsyncStorage.removeItem(entry.key);
          totalSize -= entry.size;
        }
      }
    } catch (error) {
      console.error('RN storage limit enforcement error:', error);
    }
  },

  hashUrl(url) {
    // Simple hash for URL storage key
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  },

  isExpired(timestamp) {
    return Date.now() - timestamp > IMAGE_CACHE_TTL;
  }
};

/**
 * Public API - unified interface
 */
const imageCacheService = {
  /**
   * Get cached image
   * @param {string} url - Image URL
   * @returns {Promise<Blob|Object|null>}
   */
  async get(url) {
    if (isReactNative()) {
      return reactNativeImageCache.get(url);
    }
    return webImageCache.get(url);
  },

  /**
   * Cache image blob
   * @param {string} url - Image URL
   * @param {Blob} blob - Image blob
   * @param {object} headers - Response headers
   * @returns {Promise<boolean>}
   */
  async set(url, blob, headers = {}) {
    if (isReactNative()) {
      return reactNativeImageCache.set(url, blob, headers);
    }
    return webImageCache.set(url, blob, headers);
  },

  /**
   * Remove specific image from cache
   * @param {string} url - Image URL
   * @returns {Promise<boolean>}
   */
  async remove(url) {
    if (isReactNative()) {
      return reactNativeImageCache.remove(url);
    }
    return webImageCache.remove(url);
  },

  /**
   * Clear all cached images
   * @returns {Promise<boolean>}
   */
  async clear() {
    if (isReactNative()) {
      return reactNativeImageCache.clear();
    }
    return webImageCache.clear();
  },

  /**
   * Get cache statistics
   * @returns {Promise<object>}
   */
  async getStats() {
    try {
      const stats = {
        platform: isReactNative() ? 'react-native' : 'web',
        cacheSize: 0,
        imageCount: 0,
        oldestImage: null,
        newestImage: null
      };

      if (isReactNative()) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith(STORAGE_KEY_PREFIX));

        for (const key of cacheKeys) {
          const data = await AsyncStorage.getItem(key);
          if (data) {
            const metadata = JSON.parse(data);
            stats.cacheSize += metadata.size;
            stats.imageCount++;
            
            if (!stats.oldestImage || metadata.timestamp < stats.oldestImage) {
              stats.oldestImage = metadata.timestamp;
            }
            if (!stats.newestImage || metadata.timestamp > stats.newestImage) {
              stats.newestImage = metadata.timestamp;
            }
          }
        }
      } else {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            stats.cacheSize += blob.size;
            stats.imageCount++;

            const metadata = await webImageCache.getMetadata(request.url);
            if (metadata) {
              if (!stats.oldestImage || metadata.timestamp < stats.oldestImage) {
                stats.oldestImage = metadata.timestamp;
              }
              if (!stats.newestImage || metadata.timestamp > stats.newestImage) {
                stats.newestImage = metadata.timestamp;
              }
            }
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
};

export default imageCacheService;
