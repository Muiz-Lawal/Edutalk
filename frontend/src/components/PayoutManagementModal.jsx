import React, { useState } from 'react';

export default function PayoutManagementModal({ onClose }) {
  const [payoutType, setPayoutType] = useState('immediate');
  const [selectedHost, setSelectedHost] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [schedule, setSchedule] = useState('immediately');
  const [scheduledDate, setScheduledDate] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const hosts = [
    { id: '1', name: 'John Smith', pending: 1250.50 },
    { id: '2', name: 'Sarah Johnson', pending: 2100.75 },
    { id: '3', name: 'Mike Davis', pending: 875.25 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedHost) {
      setFormError('Please select a host');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    if (schedule === 'scheduled' && !scheduledDate) {
      setFormError('Please select a scheduled date');
      return;
    }

    setSubmitting(true);
    try {
      // API call would go here
      console.log({
        host: selectedHost,
        amount,
        description,
        schedule,
        scheduledDate,
      });
      
      alert('Payout created successfully!');
      onClose();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedHostData = hosts.find(h => h.id === selectedHost);

  return (
    <div className="modal-overlay" onClick={onClose}>
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

        .payout-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #1a1a1a;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-button:hover {
          color: #1a1a1a;
        }

        .modal-content {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-section h3 {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin: 0 0 16px 0;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .form-group select,
        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-group select:focus,
        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .radio-group {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .radio-option {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .radio-option:hover {
          border-color: #3b82f6;
          background: #f0f7ff;
        }

        .radio-option input[type="radio"] {
          margin-right: 8px;
          cursor: pointer;
        }

        .radio-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .host-info {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          margin-top: 8px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .host-info-item {
          display: flex;
          flex-direction: column;
        }

        .host-info-item label {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .host-info-item value {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 600;
        }

        .payout-summary {
          background: #f0f7ff;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          border-radius: 6px;
          margin-top: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .summary-row:last-child {
          margin-bottom: 0;
          padding-top: 8px;
          border-top: 1px solid rgba(59, 130, 246, 0.2);
          font-weight: 600;
          color: #1a1a1a;
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          border-left: 4px solid #dc2626;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #1a1a1a;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d1d5db;
        }
      `}</style>

      <div className="payout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💳 Process Payout</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          {formError && <div className="error-message">{formError}</div>}

          <div className="form-section">
            <h3>Payout Type</h3>
            <div className="radio-group">
              <label className={`radio-option ${payoutType === 'immediate' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  value="immediate" 
                  checked={payoutType === 'immediate'}
                  onChange={(e) => setPayoutType(e.target.value)}
                />
                <span>Immediate Payout</span>
              </label>
              <label className={`radio-option ${payoutType === 'scheduled' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  value="scheduled" 
                  checked={payoutType === 'scheduled'}
                  onChange={(e) => setPayoutType(e.target.value)}
                />
                <span>Scheduled Payout</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Host Selection</h3>
            <div className="form-group">
              <label>Select Host</label>
              <select 
                value={selectedHost}
                onChange={(e) => setSelectedHost(e.target.value)}
                required
              >
                <option value="">Choose a host...</option>
                {hosts.map(host => (
                  <option key={host.id} value={host.id}>
                    {host.name} - Pending: ${host.pending.toFixed(2)}
                  </option>
                ))}
              </select>
              
              {selectedHostData && (
                <div className="host-info">
                  <div className="host-info-item">
                    <label>Pending Payout</label>
                    <value>${selectedHostData.pending.toFixed(2)}</value>
                  </div>
                  <div className="host-info-item">
                    <label>Status</label>
                    <value>Active</value>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3>Payout Details</h3>
            <div className="form-group">
              <label>Amount ($)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
              {selectedHostData && amount && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Max available: ${selectedHostData.pending.toFixed(2)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Monthly payout, weekly commission split, etc."
              />
            </div>
          </div>

          {payoutType === 'scheduled' && (
            <div className="form-section">
              <h3>Schedule</h3>
              <div className="form-group">
                <label>Payment Date</label>
                <input 
                  type="date" 
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
          )}

          {amount && (
            <div className="payout-summary">
              <div className="summary-row">
                <span>Payout Amount</span>
                <span>${parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Processing Fee (1%)</span>
                <span>${(parseFloat(amount) * 0.01).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Total to Host</span>
                <span>${(parseFloat(amount) - parseFloat(amount) * 0.01).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Create Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
