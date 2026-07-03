import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

const HostSuspensionModal = ({ host, action, onClose, onSuccess }) => {
  const { suspendHost, unsuspendHost } = useAdmin();
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('7'); // days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isSuspend = action === 'suspend';
  const suspensionReasons = [
    'Policy violation',
    'Low student satisfaction',
    'Quality concerns',
    'Community complaint',
    'Under review',
    'Other reason'
  ];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    if (isSuspend && !duration) {
      setError('Please select a suspension duration');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSuspend) {
        await suspendHost(host._id || host.hostId, {
          reason,
          duration: parseInt(duration)
        });
      } else {
        await unsuspendHost(host._id || host.hostId, reason);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || `Failed to ${isSuspend ? 'suspend' : 'unsuspend'} host`);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <style>{`
        .host-suspension-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .suspension-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          color: white;
        }

        .suspension-header h2 {
          margin: 0 0 8px 0;
          font-size: 22px;
          font-weight: 700;
        }

        .suspension-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .suspension-content {
          padding: 24px;
        }

        .host-info-box {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #ef4444;
          margin-bottom: 20px;
        }

        .host-info-box h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .host-info-box p {
          margin: 4px 0;
          font-size: 14px;
          color: #666;
        }

        .warning-box {
          background: #fee2e2;
          padding: 12px;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
          margin-bottom: 20px;
        }

        .warning-box p {
          margin: 0;
          font-size: 14px;
          color: #991b1b;
          font-weight: 500;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .reason-selector {
          display: grid;
          gap: 8px;
        }

        .reason-option {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .reason-option:hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .reason-option input[type="radio"] {
          margin-right: 12px;
          cursor: pointer;
        }

        .reason-option.selected {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .duration-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 10px;
        }

        .duration-option {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
          justify-content: center;
          font-weight: 500;
        }

        .duration-option:hover {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .duration-option input[type="radio"] {
          display: none;
        }

        .duration-option.selected {
          background: #dbeafe;
          border-color: #3b82f6;
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 15px;
          border-left: 4px solid #dc2626;
          font-size: 14px;
        }

        .suspension-footer {
          display: flex;
          gap: 10px;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          justify-content: flex-end;
        }

        .button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 100px;
        }

        .button.secondary {
          background: white;
          color: #666;
          border: 1px solid #ddd;
        }

        .button.secondary:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #3b82f6;
        }

        .button.primary {
          background: #3b82f6;
          color: white;
        }

        .button.primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .button.danger {
          background: #ef4444;
          color: white;
        }

        .button.danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-text {
          display: inline-block;
          margin-right: 8px;
        }
      `}</style>

      <div className="host-suspension-modal">
        {/* Header */}
        <div className="suspension-header">
          <h2>
            {isSuspend ? '🔒 Suspend Host' : '🔓 Unsuspend Host'}
          </h2>
          <p>
            {isSuspend
              ? 'This will prevent the host from creating new classes'
              : 'This will restore the host\'s account access'}
          </p>
        </div>

        {/* Content */}
        <div className="suspension-content">
          {/* Host Info */}
          <div className="host-info-box">
            <h3>{host.hostName || host.name}</h3>
            <p>Email: {host.email}</p>
            <p>Plan Tier: {host.planTier || 'Starter'}</p>
            {host.status === 'suspended' && (
              <p style={{ color: '#ef4444', fontWeight: '600' }}>Status: Currently Suspended</p>
            )}
          </div>

          {/* Warning */}
          {isSuspend && (
            <div className="warning-box">
              <p>⚠️ This action will immediately suspend the host and prevent them from accessing their dashboard.</p>
            </div>
          )}

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Reason */}
          <div className="form-group">
            <label>{isSuspend ? 'Suspension Reason' : 'Reinstatement Reason'}:</label>
            <div className="reason-selector">
              {suspensionReasons.map(r => (
                <label
                  key={r}
                  className={`reason-option ${reason === r ? 'selected' : ''}`}
                  onClick={() => setReason(r)}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* Duration (only for suspend) */}
          {isSuspend && (
            <div className="form-group">
              <label>Duration:</label>
              <div className="duration-grid">
                {['7', '14', '30', 'permanent'].map(d => (
                  <label
                    key={d}
                    className={`duration-option ${duration === d ? 'selected' : ''}`}
                    onClick={() => setDuration(d)}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={d}
                      checked={duration === d}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                    {d === 'permanent' ? 'Permanent' : `${d} days`}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {reason && (
            <div className="form-group">
              <label>Additional Notes (Optional):</label>
              <textarea
                placeholder={isSuspend ? 'Enter suspension details...' : 'Enter reinstatement details...'}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="suspension-footer">
          <button
            className="button secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`button ${isSuspend ? 'danger' : 'primary'}`}
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading && <span className="loading-text">⏳</span>}
            {isSuspend ? 'Suspend' : 'Unsuspend'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostSuspensionModal;
