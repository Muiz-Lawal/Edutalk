import React, { useState } from 'react';

export default function RefundManagementModal({ transaction, onClose }) {
  const [refundType, setRefundType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!transaction) return null;

  const refundOptions = [
    { id: 'full', label: 'Full Refund', amount: transaction.amount },
    { id: 'partial', label: 'Partial Refund', amount: null },
    { id: 'percentage', label: 'Percentage Refund', amount: null },
  ];

  const reasonOptions = [
    { value: 'student_request', label: 'Student Request' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'class_cancelled', label: 'Class Cancelled' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'other', label: 'Other' },
  ];

  const calculateRefundAmount = () => {
    if (refundType === 'full') {
      return transaction.amount;
    } else if (refundType === 'partial') {
      return parseFloat(customAmount) || 0;
    } else if (refundType === 'percentage') {
      return (transaction.amount * parseFloat(customAmount || 0)) / 100;
    }
    return 0;
  };

  const refundAmount = calculateRefundAmount();
  const stripeFee = refundAmount * 0.029 + 0.30;
  const platformCommissionRefund = (refundAmount / transaction.amount) * transaction.platformFee;
  const hostRefund = refundAmount - platformCommissionRefund - stripeFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!reason) {
      setFormError('Please select a refund reason');
      return;
    }

    if (refundAmount <= 0) {
      setFormError('Refund amount must be greater than 0');
      return;
    }

    if (refundAmount > transaction.amount) {
      setFormError('Refund amount cannot exceed original transaction amount');
      return;
    }

    setSubmitting(true);
    try {
      // API call would go here
      console.log({
        transactionId: transaction._id,
        refundType,
        refundAmount,
        reason,
        notes,
      });

      alert('Refund initiated successfully!');
      onClose();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

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

        .refund-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
          max-width: 650px;
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

        .transaction-summary {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .summary-item {
          display: flex;
          flex-direction: column;
        }

        .summary-item label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 4px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .summary-item value {
          font-size: 16px;
          color: #1a1a1a;
          font-weight: 600;
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
          min-height: 80px;
          resize: vertical;
        }

        .radio-group {
          display: grid;
          grid-template-columns: 1fr;
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
          margin-right: 12px;
          cursor: pointer;
        }

        .radio-option.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .refund-calculation {
          background: #f0f7ff;
          border-left: 4px solid #3b82f6;
          padding: 16px;
          border-radius: 6px;
          margin-top: 16px;
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .calc-row:last-child {
          margin-bottom: 0;
          padding-top: 10px;
          border-top: 1px solid rgba(59, 130, 246, 0.2);
          font-weight: 600;
          color: #1a1a1a;
        }

        .warning-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #92400e;
          line-height: 1.5;
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

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #dc2626;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #1a1a1a;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #d1d5db;
        }
      `}</style>

      <div className="refund-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>↩️ Manage Refund</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          {/* Transaction Summary */}
          <div className="transaction-summary">
            <div className="summary-item">
              <label>Transaction ID</label>
              <value>{transaction._id.substring(0, 8)}...</value>
            </div>
            <div className="summary-item">
              <label>Original Amount</label>
              <value>${transaction.amount.toFixed(2)}</value>
            </div>
            <div className="summary-item">
              <label>Student</label>
              <value>{transaction.studentName}</value>
            </div>
          </div>

          {formError && <div className="error-message">{formError}</div>}

          {/* Refund Type Selection */}
          <div className="form-section">
            <h3>Refund Type</h3>
            <div className="radio-group">
              {refundOptions.map(option => (
                <label 
                  key={option.id}
                  className={`radio-option ${refundType === option.id ? 'selected' : ''}`}
                >
                  <input 
                    type="radio" 
                    value={option.id} 
                    checked={refundType === option.id}
                    onChange={(e) => setRefundType(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Refund Amount */}
          {refundType === 'partial' && (
            <div className="form-section">
              <h3>Refund Amount</h3>
              <div className="form-group">
                <label>Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max={transaction.amount}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          )}

          {refundType === 'percentage' && (
            <div className="form-section">
              <h3>Refund Percentage</h3>
              <div className="form-group">
                <label>Percentage (%)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="0"
                  max="100"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div className="form-section">
            <h3>Refund Reason</h3>
            <div className="form-group">
              <label>Select Reason</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">Choose a reason...</option>
                {reasonOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="form-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label>Notes</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this refund..."
              />
            </div>
          </div>

          {/* Refund Calculation */}
          {refundAmount > 0 && (
            <>
              <div className="warning-box">
                ⚠️ This refund will impact platform revenue and host earnings. Both parties will be notified of the refund.
              </div>

              <div className="refund-calculation">
                <div className="calc-row">
                  <span>Refund Amount</span>
                  <strong>${refundAmount.toFixed(2)}</strong>
                </div>
                <div className="calc-row">
                  <span>Platform Commission Refund</span>
                  <span>${platformCommissionRefund.toFixed(2)}</span>
                </div>
                <div className="calc-row">
                  <span>Stripe Fee (Refunded)</span>
                  <span>${stripeFee.toFixed(2)}</span>
                </div>
                <div className="calc-row">
                  <span>Host Amount Refunded</span>
                  <strong>${hostRefund.toFixed(2)}</strong>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
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
              className="btn btn-danger"
              disabled={submitting || refundAmount <= 0}
            >
              {submitting ? 'Processing...' : 'Process Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
