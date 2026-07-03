/**
 * Local Data Caching Service
 * Handles caching of application data (classes, videos, user info)
 * For web: LocalStorage, For mobile: AsyncStorage
 */

const CACHE_PREFIX = 'edutalk_cache_';
const CACHE_TTL = {
  classes: 60 * 60 * 1000, // 1 hour
  videos: 24 * 60 * 60 * 1000, // 24 hours
  user: 7 * 24 * 60 * 60 * 1000, // 7 days
  analytics: 60 * 60 * 1000, // 1 hour
  default: 30 * 60 * 1000 // 30 minutes
};

const STORAGE_LIMIT = {
  web: 5 * 1024 * 1024, // 5 MB for web
  mobile: 10 * 1024 * 1024 // 10 MB for mobile
};

/**
 * Platform detection
 */
const isReactNative = () => {
  return typeof global !== 'undefined' && 
         global.__DEV__ !== undefined &&
         !window.document;
};

/**
 * Web platform implementation using LocalStorage
 */
const webDataCache = {
  store: {}, // In-memory cache layer
  
  async get(key) {
    try {
      // Check in-memory cache first
      const inMemory = this.store[key];
      if (inMemory && !this.isExpired(inMemory.expiresAt)) {
        return inMemory.value;
      }

      // Check LocalStorage
      const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (item) {
        const cached = JSON.parse(item);
        if (!this.isExpired(cached.expiresAt)) {
          this.store[key] = cached;
          return cached.value;
        } else {
          localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        }
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  },

  async set(key, value, ttl = CACHE_TTL.default) {
    try {
      const expiresAt = Date.now() + ttl;
      const cacheItem = { value, expiresAt };

      // Store in-memory
      this.store[key] = cacheItem;

      // Store in LocalStorage
      try {
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
        await this.enforceStorageLimit();
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          // Clear old entries and retry
          await this.clearExpired();
          try {
            localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
          } catch (retryError) {
            console.warn('Still cannot store in LocalStorage:', retryError);
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
      return false;
    }
  },

  async remove(key) {
    try {
      delete this.store[key];
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error(`Cache remove error for ${key}:`, error);
      return false;
    }
  },

  async clear() {
    try {
      this.store = {};
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  },

  async clearExpired() {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          const item = JSON.parse(localStorage.getItem(key));
          if (this.isExpired(item.expiresAt)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Clear expired cache error:', error);
    }
  },

  async enforceStorageLimit() {
    try {
      const keys = Object.keys(localStorage);
      const cacheItems = [];

      for (const key of keys) {
        if (key.startsWith(CACHE_PREFIX)) {
          const item = JSON.parse(localStorage.getItem(key));
          cacheItems.push({
            key,
            size: new Blob([localStorage.getItem(key)]).size,
            expiresAt: item.expiresAt
          });
        }
      }

      // Calculate total size
      let totalSize = cacheItems.reduce((sum, item) => sum + item.size, 0);

      // Remove old items if over limit
      if (totalSize > STORAGE_LIMIT.web) {
        cacheItems.sort((a, b) => a.expiresAt - b.expiresAt);

        for (const item of cacheItems) {
          if (totalSize <= STORAGE_LIMIT.web * 0.8) break;
          localStorage.removeItem(item.key);
          totalSize -= item.size;
        }
      }
    } catch (error) {
      console.error('Enforce storage limit error:', error);
    }
  },

  isExpired(expiresAt) {
    return Date.now() > expiresAt;
  }
};

/**
 * React Native implementation using AsyncStorage
 */
const mobileDataCache = {
  async get(key) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const item = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);

      if (item) {
        const cached = JSON.parse(item);
        if (!this.isExpired(cached.expiresAt)) {
          return cached.value;
        } else {
          await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        }
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  },

  async set(key, value, ttl = CACHE_TTL.default) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const expiresAt = Date.now() + ttl;
      const cacheItem = { value, expiresAt };

      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
      await this.enforceStorageLimit();

      return true;
    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
      return false;
    }
  },

  async remove(key) {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error(`Cache remove error for ${key}:`, error);
      return false;
    }
  },

  async clear() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  },

  async clearExpired() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));

      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const cached = JSON.parse(item);
          if (this.isExpired(cached.expiresAt)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Clear expired cache error:', error);
    }
  },

  async enforceStorageLimit() {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      const items = [];

      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          items.push({
            key,
            size: new Blob([item]).size,
            expiresAt: JSON.parse(item).expiresAt
          });
        }
      }

      let totalSize = items.reduce((sum, item) => sum + item.size, 0);

      if (totalSize > STORAGE_LIMIT.mobile) {
        items.sort((a, b) => a.expiresAt - b.expiresAt);

        for (const item of items) {
          if (totalSize <= STORAGE_LIMIT.mobile * 0.8) break;
          await AsyncStorage.removeItem(item.key);
          totalSize -= item.size;
        }
      }
    } catch (error) {
      console.error('Enforce storage limit error:', error);
    }
  },

  isExpired(expiresAt) {
    return Date.now() > expiresAt;
  }
};

/**
 * Public API
 */
const localCacheService = {
  /**
   * Get cached value
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    if (isReactNative()) {
      return mobileDataCache.get(key);
    }
    return webDataCache.get(key);
  },

  /**
   * Set cached value with TTL
   * @param {string} key
   * @param {any} value
   * @param {string} dataType - 'classes', 'videos', 'user', 'analytics'
   * @returns {Promise<boolean>}
   */
  async set(key, value, dataType = 'default') {
    const ttl = CACHE_TTL[dataType] || CACHE_TTL.default;
    
    if (isReactNative()) {
      return mobileDataCache.set(key, value, ttl);
    }
    return webDataCache.set(key, value, ttl);
  },

  /**
   * Cache classes data
   */
  async setClasses(classes) {
    return this.set('classes_all', classes, 'classes');
  },

  async getClasses() {
    return this.get('classes_all');
  },

  /**
   * Cache class details
   */
  async setClassDetails(classId, details) {
    return this.set(`class_${classId}`, details, 'classes');
  },

  async getClassDetails(classId) {
    return this.get(`class_${classId}`);
  },

  /**
   * Cache user data
   */
  async setUser(user) {
    return this.set('user_profile', user, 'user');
  },

  async getUser() {
    return this.get('user_profile');
  },

  /**
   * Cache video data
   */
  async setVideo(videoId, video) {
    return this.set(`video_${videoId}`, video, 'videos');
  },

  async getVideo(videoId) {
    return this.get(`video_${videoId}`);
  },

  /**
   * Cache analytics
   */
  async setAnalytics(analyticsId, data) {
    return this.set(`analytics_${analyticsId}`, data, 'analytics');
  },

  async getAnalytics(analyticsId) {
    return this.get(`analytics_${analyticsId}`);
  },

  /**
   * Remove specific cache entry
   */
  async remove(key) {
    if (isReactNative()) {
      return mobileDataCache.remove(key);
    }
    return webDataCache.remove(key);
  },

  /**
   * Clear all cache
   */
  async clear() {
    if (isReactNative()) {
      return mobileDataCache.clear();
    }
    return webDataCache.clear();
  },

  /**
   * Clear expired entries
   */
  async clearExpired() {
    if (isReactNative()) {
      return mobileDataCache.clearExpired();
    }
    return webDataCache.clearExpired();
  },

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      const stats = {
        platform: isReactNative() ? 'react-native' : 'web',
        totalSize: 0,
        entryCount: 0,
        limit: isReactNative() ? STORAGE_LIMIT.mobile : STORAGE_LIMIT.web
      };

      if (isReactNative()) {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));

        for (const key of cacheKeys) {
          const item = await AsyncStorage.getItem(key);
          if (item) {
            stats.totalSize += new Blob([item]).size;
            stats.entryCount++;
          }
        }
      } else {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
          if (key.startsWith(CACHE_PREFIX)) {
            stats.totalSize += new Blob([localStorage.getItem(key)]).size;
            stats.entryCount++;
          }
        }
      }

      stats.percentageUsed = Math.round((stats.totalSize / stats.limit) * 100);
      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
};

export default localCacheService;
