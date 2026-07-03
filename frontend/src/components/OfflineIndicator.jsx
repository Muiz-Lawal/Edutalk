import { useEffect, useState } from 'react';
import '../styles/offline-indicator.css';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✓ Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('✗ Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      <span className="offline-icon">📡</span>
      <span className="offline-text">You are offline - some features may be limited</span>
    </div>
  );
}
