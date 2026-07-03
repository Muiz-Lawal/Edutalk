import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

export const AdminMessageModal = ({ user, isOpen, onClose, onSuccess }) => {
  const { sendAdminMessage } = useAdmin();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState('notification');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !content.trim()) {
      setError('Subject and content are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const result = await sendAdminMessage(user._id, subject, content, messageType);
    
    if (result) {
      setSuccess('Message sent successfully!');
      setSubject('');
      setContent('');
      setMessageType('notification');
      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setError('Failed to send message. Please try again.');
    }
    
    setLoading(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Send Message to {user.firstName} {user.lastName}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSendMessage}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="form-group">
              <label htmlFor="recipient">Recipient:</label>
              <input
                type="text"
                id="recipient"
                value={user.email}
                disabled
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Message Type:</label>
              <select
                id="type"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="form-input"
              >
                <option value="notification">Notification</option>
                <option value="warning">Warning</option>
                <option value="suspension">Suspension Notice</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject:</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter message subject..."
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Message Content:</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter message content..."
                className="form-textarea"
                rows="6"
              />
              <small style={{ color: '#999' }}>
                {content.length} characters
              </small>
            </div>

            {/* Preview */}
            {subject && content && (
              <div className="preview-section">
                <h4>Preview:</h4>
                <div className="preview-box">
                  <div className="preview-header">
                    <span className="preview-type">{messageType}</span>
                  </div>
                  <div className="preview-body">
                    <h5>{subject}</h5>
                    <p>{content}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !subject.trim() || !content.trim()}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-dialog {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.3rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
        }

        .modal-body {
          padding: 20px;
        }

        .alert {
          padding: 12px 15px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .form-input:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
          resize: vertical;
        }

        .form-textarea:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
        }

        .form-group small {
          display: block;
          margin-top: 5px;
        }

        .preview-section {
          margin-top: 25px;
          padding-top: 20px;
          border-top: 2px solid #f0f0f0;
        }

        .preview-section h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
          font-size: 14px;
        }

        .preview-box {
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
          background: #fafafa;
        }

        .preview-header {
          padding: 10px 15px;
          background: #f0f0f0;
          border-bottom: 1px solid #ddd;
        }

        .preview-type {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 600;
          background: #2196F3;
          color: white;
          text-transform: capitalize;
        }

        .preview-body {
          padding: 15px;
        }

        .preview-body h5 {
          margin: 0 0 10px 0;
          color: #333;
          font-size: 16px;
        }

        .preview-body p {
          margin: 0;
          color: #666;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #eee;
          background: #fafafa;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d0d0d0;
        }

        .btn-primary {
          background: #2196F3;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0b7dda;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default AdminMessageModal;
