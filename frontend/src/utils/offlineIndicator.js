/**
 * PWA - Offline Indicator Component
 * Shows when user is offline with sync status
 */

export const createOfflineIndicator = () => {
  const style = `
    .offline-indicator {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff6b6b;
      color: white;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      animation: slideDown 0.3s ease-out;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .offline-indicator.online {
      background: #51cf66;
    }

    .offline-indicator__content {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .offline-indicator__status {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .offline-indicator__icon {
      font-size: 16px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .offline-indicator.online .offline-indicator__icon {
      animation: none;
    }

    .offline-indicator__message {
      flex: 1;
    }

    .offline-indicator__action {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      transition: background 0.2s;
    }

    .offline-indicator__action:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .offline-indicator__sync {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
    }

    .offline-indicator__sync-spinner {
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Adjust main content when indicator is visible */
    body.offline-active main,
    body.offline-active .app-content {
      margin-top: 48px;
    }
  `;

  const html = `
    <div class="offline-indicator offline" id="offline-indicator">
      <div class="offline-indicator__content">
        <div class="offline-indicator__status">
          <span class="offline-indicator__icon">📡</span>
          <span class="offline-indicator__message">You're offline • Changes will be synced</span>
        </div>
      </div>
      <button class="offline-indicator__action" id="sync-now">
        Sync Now
      </button>
    </div>
  `;

  const syncIndicatorHtml = `
    <div class="offline-indicator__sync" id="sync-status" style="display: none;">
      <span class="offline-indicator__sync-spinner"></span>
      <span>Syncing...</span>
    </div>
  `;

  return {
    style,
    html,
    syncIndicatorHtml,
  };
};

/**
 * Offline Indicator Script
 */
export const offlineIndicatorScript = `
(function() {
  const indicator = document.getElementById('offline-indicator');
  const syncBtn = document.getElementById('sync-now');
  const syncStatus = document.getElementById('sync-status');

  if (!indicator) return;

  // Update indicator status
  function updateStatus() {
    const isOnline = navigator.onLine;
    
    if (isOnline) {
      indicator.classList.remove('offline');
      indicator.classList.add('online');
      indicator.querySelector('.offline-indicator__message').textContent = 
        'You\'re online • All changes synced';
      
      // Hide after 3 seconds
      setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.pointerEvents = 'none';
        setTimeout(() => {
          indicator.style.display = 'none';
        }, 300);
      }, 3000);
    } else {
      indicator.classList.remove('online');
      indicator.classList.add('offline');
      indicator.style.display = 'flex';
      indicator.style.opacity = '1';
      indicator.style.pointerEvents = 'auto';
      document.body.classList.add('offline-active');
    }
  }

  // Listen for online/offline events
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);

  // Sync button handler
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncStatus.style.display = 'flex';
      syncBtn.disabled = true;
      
      try {
        // Call offline queue sync
        if (window.offlineQueueService && window.offlineQueueService.processQueue) {
          const result = await window.offlineQueueService.processQueue();
          
          if (result.failed === 0) {
            updateStatus();
          }
        }
      } catch (error) {
        console.error('Sync failed:', error);
      } finally {
        syncStatus.style.display = 'none';
        syncBtn.disabled = false;
      }
    });
  }

  // Initial status
  updateStatus();
})();
`;

/**
 * Inject offline indicator into page
 */
export const injectOfflineIndicator = () => {
  // Create styles
  const styleEl = document.createElement('style');
  styleEl.textContent = createOfflineIndicator().style;
  document.head.appendChild(styleEl);

  // Create HTML
  const container = document.createElement('div');
  container.innerHTML = createOfflineIndicator().html;
  document.body.insertBefore(container.firstChild, document.body.firstChild);

  // Execute script
  const script = document.createElement('script');
  script.textContent = offlineIndicatorScript;
  document.body.appendChild(script);

  console.log('✓ Offline indicator injected');
};
