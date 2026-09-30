// Hook for PWA installation prompt
import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem('pwaInstallDismissedAt') || 0);
    } catch {
      dismissedAt = 0;
    }
    const dismissStillValid = dismissedAt > 0 && (Date.now() - dismissedAt) < 30 * 24 * 60 * 60 * 1000;

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    if (dismissStillValid) {
      return undefined;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
      try {
        localStorage.removeItem('pwaInstallDismissedAt');
      } catch {
        // Installation remains successful when browser storage is unavailable.
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    setInstallPrompt(null);
    setIsInstallable(false);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
  };

  return {
    installPrompt,
    isInstallable,
    isInstalled,
    install,
  };
};
