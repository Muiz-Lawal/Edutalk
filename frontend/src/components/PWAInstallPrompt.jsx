import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
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
    try {
      localStorage.setItem('pwaInstallDismissedAt', String(Date.now()));
    } catch {
      // The prompt still dismisses for this visit if storage is unavailable.
    }
    setShowPrompt(false);
  };

  return (
    <aside className="pwa-install-prompt" aria-label="Install EduTalk">
      <div className="prompt-content">
        <Download className="prompt-icon" size={22} aria-hidden="true" />
        <div className="prompt-text">
          <p>Install EduTalk on your device</p>
        </div>
        <div className="prompt-actions">
          <button className="btn-install" onClick={handleInstall}>
            Install
          </button>
        </div>
        <button className="btn-dismiss" onClick={handleDismiss} aria-label="Dismiss install prompt">
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};

export default PWAInstallPrompt;
