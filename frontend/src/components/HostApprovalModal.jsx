import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

const HostApprovalModal = ({ host, action, onClose, onSuccess }) => {
  const { approveHost, rejectHost } = useAdmin();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isApprove = action === 'approve';
  const reasons = isApprove
    ? ['Verified qualifications', 'Good reputation', 'Meets platform standards']
    : [
        'Insufficient qualifications',
        'Failed background check',
        'Poor teaching history',
        'Community violations',
        'Other reason'
      ];

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isApprove) {
        await approveHost(host._id || host.hostId, reason);
      } else {
        await rejectHost(host._id || host.hostId, reason);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || `Failed to ${isApprove ? 'approve' : 'reject'} host`);
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
        .host-approval-modal {
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

        .approval-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .approval-header h2 {
          margin: 0 0 8px 0;
          font-size: 22px;
          font-weight: 700;
        }

        .approval-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .approval-content {
          padding: 24px;
        }

        .host-info-box {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
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

        .reason-text {
          margin-top: 20px;
        }

        .reason-text textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 100px;
        }

        .reason-text textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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

        .approval-footer {
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
          background: #22c55e;
          color: white;
        }

        .button.primary:hover:not(:disabled) {
          background: #16a34a;
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

      <div className="host-approval-modal">
        {/* Header */}
        <div className="approval-header">
          <h2>
            {isApprove ? '✓ Approve Host' : '✕ Reject Host'}
          </h2>
          <p>
            {isApprove ? 'Approve this host to allow them to create classes' : 'Provide a reason for rejection'}
          </p>
        </div>

        {/* Content */}
        <div className="approval-content">
          {/* Host Info */}
          <div className="host-info-box">
            <h3>{host.hostName || host.name}</h3>
            <p>Email: {host.email}</p>
            <p>Plan Tier: {host.planTier || 'Starter'}</p>
            {host.bio && <p>Bio: {host.bio}</p>}
          </div>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Reason Selector */}
          <div className="form-group">
            <label>{isApprove ? 'Approval Reason' : 'Rejection Reason'}:</label>
            <div className="reason-selector">
              {reasons.map(r => (
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

          {/* Additional Comments */}
          {reason && (
            <div className="reason-text">
              <label>Additional Comments (Optional):</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter your detailed reason or feedback..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="approval-footer">
          <button
            className="button secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={`button ${isApprove ? 'primary' : 'danger'}`}
            onClick={handleSubmit}
            disabled={loading || !reason.trim()}
          >
            {loading && <span className="loading-text">⏳</span>}
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HostApprovalModal;
