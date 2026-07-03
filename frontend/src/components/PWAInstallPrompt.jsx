import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import '../styles/PWAInstallPrompt.css';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(true);

  if (isInstalled || !isInstallable || !showPrompt) {
    return null;
  }

  const handleInstall = async () => {
    await install();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissedAt', String(Date.now()));
    setShowPrompt(false);
  };

  return (
    <div className="pwa-install-prompt">
      <div className="prompt-content">
        <div className="prompt-icon">📱</div>
        <div className="prompt-text">
          <h3>Install EduTalk</h3>
          <p>Get quick access to your classes on your home screen</p>
        </div>
        <div className="prompt-actions">
          <button className="btn-install" onClick={handleInstall}>
            Install
          </button>
          <button className="btn-dismiss" onClick={handleDismiss}>
            Not now
          </button>
        </div>
        <button className="btn-close" onClick={handleDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
