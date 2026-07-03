/**
 * Sync Status Component
 * Shows offline/online status and pending action queue
 * Displays sync progress and retry controls
 */

import { useState, useEffect } from 'react';
import offlineQueueService from '../utils/offlineQueueService';
import '../styles/sync-status.css';

export default function SyncStatusComponent({ onStatusChange }) {
  const [status, setStatus] = useState('online'); // 'online', 'offline', 'syncing'
  const [pendingCount, setPendingCount] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [queueDetails, setQueueDetails] = useState([]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus('syncing');
      processQueue();
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      setStatus('online');
    } else {
      setStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count
  useEffect(() => {
    const updatePendingCount = async () => {
      const queue = offlineQueueService.getQueue?.() || [];
      setPendingCount(queue.length);
      setQueueDetails(queue);
    };

    updatePendingCount();

    // Poll for changes
    const interval = setInterval(updatePendingCount, 2000);
    return () => clearInterval(interval);
  }, []);

  // Process queue when online
  const processQueue = async () => {
    try {
      setStatus('syncing');

      const queue = offlineQueueService.getQueue?.() || [];
      const total = queue.length;

      if (total === 0) {
        setStatus('online');
        setSyncProgress(100);
        setLastSyncTime(new Date());
        setTimeout(() => setSyncProgress(0), 2000);
        return;
      }

      // Process queue with progress updates
      if (offlineQueueService.processQueue) {
        await offlineQueueService.processQueue();
      }

      setStatus('online');
      setSyncProgress(100);
      setLastSyncTime(new Date());
      setPendingCount(0);
      setQueueDetails([]);

      // Reset progress bar after 2 seconds
      setTimeout(() => setSyncProgress(0), 2000);
    } catch (error) {
      console.error('Queue processing error:', error);
      setStatus('offline');
    }
  };

  // Manual retry
  const handleRetry = async () => {
    if (!navigator.onLine) {
      alert('No internet connection. Please check your connection and try again.');
      return;
    }

    await processQueue();
  };

  // Clear queue
  const handleClearQueue = () => {
    if (
      confirm(
        `Are you sure you want to clear ${pendingCount} pending actions? This cannot be undone.`
      )
    ) {
      offlineQueueService.clearQueue?.();
      setPendingCount(0);
      setQueueDetails([]);
    }
  };

  // Status display text
  const getStatusText = () => {
    switch (status) {
      case 'offline':
        return `Offline • ${pendingCount} pending`;
      case 'syncing':
        return `Syncing... (${Math.round(syncProgress)}%)`;
      case 'online':
        return 'Synced';
      default:
        return 'Unknown';
    }
  };

  // Status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'offline':
        return '⚠️';
      case 'syncing':
        return '🔄';
      case 'online':
        return '✓';
      default:
        return '?';
    }
  };

  // Status color
  const getStatusColor = () => {
    switch (status) {
      case 'offline':
        return 'red';
      case 'syncing':
        return 'amber';
      case 'online':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <>
      {/* Mini Status Bar (Always Visible) */}
      <div className={`sync-status-bar sync-status-${getStatusColor()}`}>
        <div className="sync-status-content">
          <button
            className="sync-status-toggle"
            onClick={() => setExpandedView(!expandedView)}
            title="Click to expand"
          >
            <span className="sync-status-icon">{getStatusIcon()}</span>
            <span className="sync-status-text">{getStatusText()}</span>
          </button>

          {pendingCount > 0 && (
            <span className="sync-status-badge">{pendingCount}</span>
          )}
        </div>

        {syncProgress > 0 && status === 'syncing' && (
          <div className="sync-progress-bar">
            <div 
              className="sync-progress-fill" 
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Expanded Detail View */}
      {expandedView && (
        <div className="sync-status-modal">
          <div className="sync-status-modal-content">
            <div className="sync-status-modal-header">
              <h3>Sync Status</h3>
              <button
                className="sync-close-button"
                onClick={() => setExpandedView(false)}
              >
                ✕
              </button>
            </div>

            <div className="sync-status-modal-body">
              {/* Status Summary */}
              <div className="sync-summary">
                <div className={`sync-status-indicator sync-status-${getStatusColor()}`}>
                  <span className="icon">{getStatusIcon()}</span>
                  <span className="text">
                    Status: <strong>{getStatusText()}</strong>
                  </span>
                </div>
              </div>

              {/* Last Sync Info */}
              {lastSyncTime && (
                <div className="sync-info">
                  <small>
                    Last synced: {lastSyncTime.toLocaleTimeString()}
                  </small>
                </div>
              )}

              {/* Pending Actions Queue */}
              {pendingCount > 0 && (
                <div className="sync-queue">
                  <h4>Pending Actions ({pendingCount})</h4>
                  <div className="queue-list">
                    {queueDetails.slice(0, 5).map((item, idx) => (
                      <div key={idx} className="queue-item">
                        <div className="queue-method">
                          <span className={`method-badge method-${item.method?.toLowerCase()}`}>
                            {item.method}
                          </span>
                        </div>
                        <div className="queue-details">
                          <small className="queue-path">{item.url}</small>
                          <small className="queue-time">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </small>
                        </div>
                        <div className="queue-status">
                          {item.retries > 0 && (
                            <span className="retry-badge">Retry {item.retries}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {pendingCount > 5 && (
                    <small className="text-muted">
                      ... and {pendingCount - 5} more
                    </small>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="sync-actions">
                {status === 'offline' && pendingCount > 0 && (
                  <button 
                    className="btn btn-primary" 
                    onClick={handleRetry}
                  >
                    Retry Sync
                  </button>
                )}

                {status === 'syncing' && (
                  <button className="btn btn-disabled" disabled>
                    Syncing... Please wait
                  </button>
                )}

                {pendingCount > 0 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={handleClearQueue}
                  >
                    Clear Pending
                  </button>
                )}

                <button 
                  className="btn btn-text" 
                  onClick={() => setExpandedView(false)}
                >
                  Close
                </button>
              </div>

              {/* Network Info */}
              <div className="sync-network-info">
                <hr />
                <small>
                  <strong>Connection:</strong> {navigator.onLine ? 'Online' : 'Offline'}
                </small>
                <br />
                {navigator.connection && (
                  <>
                    <small>
                      <strong>Network Type:</strong>{' '}
                      {navigator.connection.effectiveType || 'Unknown'}
                    </small>
                    <br />
                  </>
                )}
                <small>
                  <strong>Auto-sync:</strong> Enabled
                </small>
              </div>
            </div>
          </div>

          {/* Modal Overlay */}
          <div 
            className="sync-status-overlay" 
            onClick={() => setExpandedView(false)}
          />
        </div>
      )}
    </>
  );
}
