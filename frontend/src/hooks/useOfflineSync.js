import { useEffect, useCallback, useState } from 'react';
import offlineStorage from '../utils/offlineStorage';
import api from '../utils/api';

export const useOfflineSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [pendingUpdates, setPendingUpdates] = useState(0);

  // Load pending updates count on mount
  useEffect(() => {
    const loadPendingCount = async () => {
      try {
        const pending = await offlineStorage.getPendingUpdates();
        setPendingUpdates(pending.length);
      } catch (err) {
        console.error('Failed to load pending updates:', err);
      }
    };

    loadPendingCount();
  }, []);

  // Sync pending updates when online
  const syncPendingUpdates = useCallback(async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const pending = await offlineStorage.getPendingUpdates();

      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      for (const update of pending) {
        try {
          // Sync based on type
          switch (update.type) {
            case 'progress-update':
              await api.put('/api/progress/' + update.data.progressId, {
                lessonsCompleted: update.data.lessonsCompleted,
                notesContent: update.data.notesContent,
                lastUpdated: update.data.lastUpdated,
              });
              break;

            case 'course-rating':
              await api.post('/api/courses/' + update.data.courseId + '/rate', {
                rating: update.data.rating,
                review: update.data.review,
              });
              break;

            case 'note-create':
              await api.post('/api/progress/' + update.data.progressId + '/notes', {
                content: update.data.content,
                timestamp: update.data.timestamp,
              });
              break;

            default:
              console.warn('Unknown update type:', update.type);
          }

          // Mark as synced
          await offlineStorage.markAsSynced(update.id);
        } catch (err) {
          console.error('Failed to sync update:', update, err);
          // Continue with next update instead of failing entirely
        }
      }

      // Reload pending count
      const remainingPending = await offlineStorage.getPendingUpdates();
      setPendingUpdates(remainingPending.length);
    } catch (err) {
      console.error('Sync error:', err);
      setSyncError(err.message);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Setup online listener
  useEffect(() => {
    const handleOnline = () => {
      syncPendingUpdates();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [syncPendingUpdates]);

  // Manually trigger sync (useful for testing)
  const triggerSync = useCallback(() => {
    syncPendingUpdates();
  }, [syncPendingUpdates]);

  return {
    isSyncing,
    syncError,
    pendingUpdates,
    triggerSync,
  };
};

export default useOfflineSync;
