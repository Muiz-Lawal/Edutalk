import React, { useState, useEffect } from 'react';
import useServiceWorker from '../hooks/useServiceWorker';
import '../styles/UpdatePrompt.css';

const UpdatePrompt = () => {
  const { updateAvailable, skipWaiting } = useServiceWorker();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowPrompt(true);
    }
  }, [updateAvailable]);

  if (!showPrompt || !updateAvailable) {
    return null;
  }

  const handleUpdate = () => {
    skipWaiting();
    // Force reload to apply new SW
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  return (
    <div className="update-prompt">
      <div className="update-content">
        <div className="update-icon">⬆️</div>
        <div className="update-text">
          <h3>App Update Available</h3>
          <p>A new version of EduTalk is ready. Restart to get the latest features and improvements.</p>
        </div>
        <div className="update-actions">
          <button className="btn-update" onClick={handleUpdate}>
            Update Now
          </button>
          <button className="btn-later" onClick={handleDismiss}>
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
