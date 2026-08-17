import { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';
import { useAdmin } from '../context/AdminContext';

const ContentReviewModal = ({ content, onClose }) => {
  const {
    approveModerationItem,
    rejectModerationItem,
    removeClass,
    suspendClass
  } = useAdmin();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [action, setAction] = useState(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      await approveModerationItem(content._id, { notes });
      setSuccess('Content approved successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to approve content');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await rejectModerationItem(content._id, { reason, notes });
      setSuccess('Content rejected successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to reject content');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!reason.trim()) {
      setError('Suspension reason is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await suspendClass(content._id, { reason, notes });
      setSuccess('Class suspended successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to suspend class');
    } finally {
      setLoading(false);
    }
  };

  const requestRemove = () => {
    if (!reason.trim()) {
      setError('Removal reason is required');
      return;
    }
    setShowRemoveConfirm(true);
  };

  const doRemove = async () => {
    setShowRemoveConfirm(false);
    setLoading(true);
    setError(null);
    try {
      await removeClass(content._id, { reason, notes });
      setSuccess('Class removed successfully');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to remove class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <style>{`
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
          }

          .modal-header h2 {
            font-size: 20px;
            font-weight: 600;
            margin: 0;
            color: #333;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #999;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }

          .close-button:hover {
            color: #333;
            background: #f5f5f5;
            border-radius: 4px;
          }

          .modal-body {
            padding: 20px;
            max-height: calc(80vh - 100px);
            overflow-y: auto;
          }

          .content-section {
            margin-bottom: 20px;
          }

          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .section-content {
            background: #f9f9f9;
            padding: 15px;
            border-radius: 6px;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }

          .info-row:last-child {
            border-bottom: none;
          }

          .info-label {
            font-weight: 600;
            color: #666;
          }

          .info-value {
            color: #333;
            text-align: right;
            max-width: 50%;
            word-break: break-word;
          }

          .flag-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }

          .flag-item {
            background: white;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 3px solid #ff9800;
          }

          .flag-reason {
            font-weight: 600;
            color: #333;
          }

          .flag-details {
            font-size: 12px;
            color: #999;
            margin-top: 4px;
          }

          .history-item {
            background: white;
            padding: 10px;
            margin-bottom: 8px;
            border-radius: 4px;
            border-left: 3px solid #2196f3;
          }

          .history-action {
            font-weight: 600;
            color: #333;
          }

          .history-details {
            font-size: 12px;
            color: #999;
            margin-top: 4px;
          }

          .form-group {
            margin-bottom: 15px;
          }

          .form-group label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
          }

          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            font-family: inherit;
            resize: vertical;
            min-height: 80px;
          }

          .form-group textarea:focus {
            outline: none;
            border-color: #2196f3;
            box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
          }

          .alert {
            padding: 12px 15px;
            border-radius: 4px;
            margin: 15px 20px 0 20px;
            font-size: 14px;
          }

          .alert-error {
            background: #ffebee;
            color: #c62828;
            border-left: 3px solid #c62828;
          }

          .alert-success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 3px solid #2e7d32;
          }

          .modal-footer {
            display: flex;
            gap: 10px;
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            background: #f9f9f9;
          }

          .btn {
            flex: 1;
            padding: 10px 16px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
          }

          .btn-secondary {
            background: #e0e0e0;
            color: #333;
          }

          .btn-secondary:hover {
            background: #d0d0d0;
          }

          .btn-success {
            background: #4caf50;
            color: white;
          }

          .btn-success:hover {
            background: #45a049;
          }

          .btn-warning {
            background: #ff9800;
            color: white;
          }

          .btn-warning:hover {
            background: #e68900;
          }

          .btn-danger {
            background: #f44336;
            color: white;
          }

          .btn-danger:hover {
            background: #da190b;
          }

          .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .action-selector {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }

          .action-button {
            padding: 10px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .action-button:hover {
            border-color: #2196f3;
            background: #f5f9ff;
          }

          .action-button.active {
            border-color: #2196f3;
            background: #2196f3;
            color: white;
          }

          .loading-spinner {
            display: inline-block;
            border: 2px solid #f0f0f0;
            border-top: 2px solid #2196f3;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            animation: spin 1s linear infinite;
            margin-right: 8px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {/* Modal Header Element Layout Block */}
        <div className="modal-header">
          <h2>Review Content</h2>
          <button className="close-button" onClick={onClose} disabled={loading}>
            &times;
          </button>
        </div>

        {/* Dynamic Warning Notification Triggers */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="modal-body">
          {/* Content Details Section */}
          <div className="content-section">
            <div className="section-title">Class Details</div>
            <div className="section-content">
              <div className="info-row">
                <span className="info-label">Title:</span>
                <span className="info-value">{content.title}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Host:</span>
                <span className="info-value">{content.hostEmail}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Students Enrolled:</span>
                <span className="info-value">{content.totalStudents || 0}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Created:</span>
                <span className="info-value">
                  {content.createdAt ? new Date(content.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Flags Section */}
          <div className="content-section">
            <div className="section-title">Reports ({content.flagCount || 0})</div>
            <div className="section-content">
              {content.flags && content.flags.length > 0 ? (
                <ul className="flag-list">
                  {content.flags.map((flag, idx) => (
                    <li key={idx} className="flag-item">
                      <div className="flag-reason">{flag.reason}</div>
                      <div className="flag-details">
                        Reported: {new Date(flag.reportedAt).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#999', margin: 0 }}>No specific flags recorded</p>
              )}
            </div>
          </div>

          {/* Action Selector */}
          <div className="content-section">
            <div className="section-title">Moderation Action</div>
            <div className="action-selector">
              <button
                type="button"
                className={`action-button ${action === 'approve' ? 'active' : ''}`}
                onClick={() => setAction('approve')}
              >
                Approve
              </button>
              <button
                type="button"
                className={`action-button ${action === 'reject' ? 'active' : ''}`}
                onClick={() => setAction('reject')}
              >
                Reject
              </button>
              <button
                type="button"
                className={`action-button ${action === 'suspend' ? 'active' : ''}`}
                onClick={() => setAction('suspend')}
              >
                Suspend
              </button>
              <button
                type="button"
                className={`action-button ${action === 'remove' ? 'active' : ''}`}
                onClick={() => setAction('remove')}
              >
                Remove
              </button>
            </div>
          </div>

          {/* Reason Field (for non-approve actions) */}
          {action && action !== 'approve' && (
            <div className="form-group">
              <label>Reason for {action === 'reject' ? 'Rejection' : action === 'suspend' ? 'Suspension' : 'Removal'} *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Enter reason for ${action}...`}
              />
            </div>
          )}

          {/* Notes Field */}
          <div className="form-group">
            <label>Moderation Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this decision..."
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          {action === 'approve' && (
            <button
              type="button"
              className="btn btn-success"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading ? <span><span className="loading-spinner"></span>Processing...</span> : 'Approve'}
            </button>
          )}
          {action === 'reject' && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={handleReject}
              disabled={loading}
            >
              {loading ? <span><span className="loading-spinner"></span>Processing...</span> : 'Reject'}
            </button>
          )}
          {action === 'suspend' && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={handleSuspend}
              disabled={loading}
            >
              {loading ? <span><span className="loading-spinner"></span>Processing...</span> : 'Suspend'}
            </button>
          )}
          {action === 'remove' && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={requestRemove}
              disabled={loading}
            >
              {loading ? <span><span className="loading-spinner"></span>Processing...</span> : 'Remove'}
            </button>
          )}
        </div>

        <ConfirmDialog
          open={showRemoveConfirm}
          title="Confirm removal"
          message="Are you sure you want to PERMANENTLY remove this class? This action cannot be undone."
          onConfirm={doRemove}
          onCancel={() => setShowRemoveConfirm(false)}
          confirmLabel="Remove"
          cancelLabel="Cancel"
        />

      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
  }
};

export default ContentReviewModal;