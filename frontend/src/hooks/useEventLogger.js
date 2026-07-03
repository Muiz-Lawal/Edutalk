import { useCallback } from 'react';
import api from '../utils/api';

// Simple hook to log events to backend
export default function useEventLogger() {
  const logEvent = useCallback(async (event) => {
    try {
      // Normalize minimal payload
      const payload = {
        userId: event.userId || null,
        action: event.action,
        targetType: event.targetType || null,
        targetId: event.targetId || null,
        value: event.value || null,
        metadata: event.metadata || null,
      };

      // Fire-and-forget
      api.post('/events', payload).catch(err => {
        // non-blocking: store locally or send later
        console.warn('Event post failed:', err?.response?.data || err.message);
      });
    } catch (err) {
      console.error('logEvent error', err);
    }
  }, []);

  return { logEvent };
}
