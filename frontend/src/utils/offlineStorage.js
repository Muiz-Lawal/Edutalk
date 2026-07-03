// Offline storage management using IndexedDB
// Stores pending updates, progress data, and syncs when online

class OfflineStorage {
  constructor(dbName = 'edutalk-offline', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  // Initialize the database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('pending-updates')) {
          db.createObjectStore('pending-updates', { keyPath: 'id', autoIncrement: true });
        }

        if (!db.objectStoreNames.contains('progress-cache')) {
          db.createObjectStore('progress-cache', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('courses-cache')) {
          db.createObjectStore('courses-cache', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('user-data')) {
          db.createObjectStore('user-data', { keyPath: 'key' });
        }
      };
    });
  }

  // Store a pending update to sync later
  async addPendingUpdate(type, data) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pending-updates'], 'readwrite');
      const store = transaction.objectStore('pending-updates');

      const update = {
        type,
        data,
        timestamp: Date.now(),
        synced: false,
      };

      const request = store.add(update);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(update);
    });
  }

  // Get all pending updates
  async getPendingUpdates() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pending-updates'], 'readonly');
      const store = transaction.objectStore('pending-updates');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.filter(u => !u.synced));
    });
  }

  // Mark update as synced
  async markAsSynced(updateId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['pending-updates'], 'readwrite');
      const store = transaction.objectStore('pending-updates');
      const request = store.get(updateId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const update = request.result;
        if (update) {
          update.synced = true;
          store.put(update);
        }
        resolve(update);
      };
    });
  }

  // Cache progress data
  async cacheProgress(progressId, progressData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progress-cache'], 'readwrite');
      const store = transaction.objectStore('progress-cache');

      const cached = {
        id: progressId,
        data: progressData,
        timestamp: Date.now(),
      };

      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(cached);
    });
  }

  // Get cached progress
  async getCachedProgress(progressId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['progress-cache'], 'readonly');
      const store = transaction.objectStore('progress-cache');
      const request = store.get(progressId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data);
    });
  }

  // Cache courses
  async cacheCourse(courseId, courseData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['courses-cache'], 'readwrite');
      const store = transaction.objectStore('courses-cache');

      const cached = {
        id: courseId,
        data: courseData,
        timestamp: Date.now(),
      };

      const request = store.put(cached);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(cached);
    });
  }

  // Get cached course
  async getCachedCourse(courseId) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['courses-cache'], 'readonly');
      const store = transaction.objectStore('courses-cache');
      const request = store.get(courseId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.data);
    });
  }

  // Store user data
  async setUserData(key, value) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['user-data'], 'readwrite');
      const store = transaction.objectStore('user-data');

      const request = store.put({ key, value, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ key, value });
    });
  }

  // Get user data
  async getUserData(key) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['user-data'], 'readonly');
      const store = transaction.objectStore('user-data');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value);
    });
  }

  // Clear all offline data
  async clear() {
    if (!this.db) await this.init();

    const stores = ['pending-updates', 'progress-cache', 'courses-cache', 'user-data'];
    
    return Promise.all(
      stores.map(storeName => 
        new Promise((resolve, reject) => {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => resolve();
        })
      )
    );
  }
}

export default new OfflineStorage();
