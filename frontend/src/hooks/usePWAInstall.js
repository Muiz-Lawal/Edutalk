// Hook for PWA installation prompt
import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem('pwaInstallDismissedAt') || 0);
    const dismissStillValid = dismissedAt && (Date.now() - dismissedAt) < 24 * 60 * 60 * 1000;

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
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
      console.log('PWA installed');
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
      localStorage.removeItem('pwaInstallDismissedAt');
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

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

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
