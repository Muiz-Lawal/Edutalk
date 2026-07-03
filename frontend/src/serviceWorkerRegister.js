export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✓ Service Worker registered:', registration);
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✓ New service worker available - refresh to update');
            // Show update notification
            notifyUserOfUpdate();
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

const notifyUserOfUpdate = () => {
  // Show a browser notification or in-app message
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('EduTalk Updated', {
      body: 'A new version is available. Refresh the page to update.',
      icon: '/icons/edutalk-icon-192.png',
    });
  }
};
