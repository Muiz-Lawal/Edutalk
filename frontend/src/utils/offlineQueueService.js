/**
 * Offline Queue Service
 * Queue API requests when offline, sync when back online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const QUEUE_KEY = 'offline_queue';

export const offlineQueueService = {
  /**
   * Add request to offline queue
   */
  async addToQueue(request) {
    try {
      const queue = await this.getQueue();
      
      const queueItem = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        method: request.method || 'POST',
        url: request.url,
        data: request.data || null,
        headers: request.headers || {},
        retries: 0,
        maxRetries: 3,
      };

      queue.push(queueItem);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      
      console.log(`✓ Request queued: ${queueItem.method} ${queueItem.url}`);
      return queueItem;
    } catch (error) {
      console.error('Failed to add to queue:', error);
      throw error;
    }
  },

  /**
   * Get all queued requests
   */
  async getQueue() {
    try {
      const queue = await AsyncStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  },

  /**
   * Process queue - send all queued requests
   */
  async processQueue() {
    try {
      const queue = await this.getQueue();
      
      if (queue.length === 0) {
        console.log('Queue is empty');
        return { success: 0, failed: 0 };
      }

      console.log(`Processing ${queue.length} queued requests...`);

      let successCount = 0;
      let failedCount = 0;
      const failedItems = [];

      for (const item of queue) {
        try {
          const response = await api({
            method: item.method,
            url: item.url,
            data: item.data,
            headers: item.headers,
            timeout: 10000,
          });

          console.log(`✓ Processed: ${item.method} ${item.url}`);
          successCount++;
        } catch (error) {
          item.retries++;

          if (item.retries < item.maxRetries) {
            failedItems.push(item);
            console.warn(`Retry ${item.retries}/${item.maxRetries}: ${item.url}`);
          } else {
            console.error(`✗ Failed after ${item.maxRetries} retries: ${item.url}`);
            failedCount++;
          }
        }
      }

      // Update queue with failed items
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failedItems));

      const result = { success: successCount, failed: failedCount };
      console.log(`Queue sync complete: ${successCount} succeeded, ${failedCount} failed`);
      
      return result;
    } catch (error) {
      console.error('Failed to process queue:', error);
      throw error;
    }
  },

  /**
   * Clear queue
   */
  async clearQueue() {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
      console.log('✓ Queue cleared');
    } catch (error) {
      console.error('Failed to clear queue:', error);
      throw error;
    }
  },

  /**
   * Get queue size
   */
  async getQueueSize() {
    try {
      const queue = await this.getQueue();
      return queue.length;
    } catch (error) {
      console.error('Failed to get queue size:', error);
      return 0;
    }
  },

  /**
   * Remove item from queue
   */
  async removeFromQueue(itemId) {
    try {
      let queue = await this.getQueue();
      queue = queue.filter((item) => item.id !== itemId);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('Failed to remove from queue:', error);
      return false;
    }
  },

  /**
   * Auto-process queue when connection restored
   */
  setupAutoSync(interval = 30000) {
    const checkConnection = async () => {
      try {
        // Simple connectivity check
        const response = await api.get('/health', { timeout: 5000 });
        if (response.status === 200) {
          console.log('✓ Connection restored, syncing queue...');
          await this.processQueue();
        }
      } catch (error) {
        console.log('Still offline, will retry later');
      }
    };

    // Check periodically
    const intervalId = setInterval(checkConnection, interval);
    
    return () => clearInterval(intervalId);
  },
};
