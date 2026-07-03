import React, { useEffect, useState } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import '../styles/PushPermissionRequest.css';

export default function PushPermissionRequest() {
  const { isSupported, isSubscribed, subscribe, isLoading } =
    usePushNotifications();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Show prompt if not subscribed and not dismissed
  useEffect(() => {
    if (
      isSupported &&
      !isSubscribed &&
      !dismissed &&
      Notification.permission === 'default'
    ) {
      // Wait 2 seconds before showing
      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, dismissed]);

  if (!isSupported || !show || isSubscribed || dismissed) {
    return null;
  }

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      setShow(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    // Remember dismissal for 24 hours
    localStorage.setItem(
      'pushNotificationDismissed',
      JSON.stringify({
        timestamp: Date.now(),
        dismissed: true,
      })
    );
  };

  return (
    <div className="push-permission-request">
      <div className="push-permission-content">
        <div className="push-permission-icon">🔔</div>
        <div className="push-permission-text">
          <h3>Never miss an update</h3>
          <p>Enable notifications to stay informed about classes, messages, and important announcements</p>
        </div>
        <div className="push-permission-actions">
          <button
            className="btn btn-enable"
            onClick={handleEnable}
            disabled={isLoading}
          >
            {isLoading ? 'Enabling...' : 'Enable Notifications'}
          </button>
          <button
            className="btn btn-dismiss"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            Not Now
          </button>
        </div>
        <button
          className="close-x"
          onClick={handleDismiss}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
