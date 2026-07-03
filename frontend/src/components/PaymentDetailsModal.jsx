import React, { useState } from 'react';

export default function PaymentDetailsModal({ transaction, onClose }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!transaction) return null;

  const calculateMetrics = () => {
    const stripeFee = transaction.amount * 0.029 + 0.30;
    const hostEarnings = transaction.amount - transaction.platformFee - stripeFee;
    return { stripeFee, hostEarnings };
  };

  const { stripeFee, hostEarnings } = calculateMetrics();

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

        .payment-details-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
          max-width: 700px;
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

        .modal-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #e5e7eb;
          padding: 0 24px;
          background: #f9fafb;
        }

        .modal-tab {
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.3s ease;
        }

        .modal-tab:hover {
          color: #1a1a1a;
        }

        .modal-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .modal-content {
          padding: 24px;
        }

        .details-section {
          margin-bottom: 24px;
        }

        .details-section h3 {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin: 0 0 12px 0;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .detail-row {
          display: flex;
          flex-direction: column;
        }

        .detail-row label {
          font-size: 12px;
          color: #999;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .detail-row value {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 500;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-badge.completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .commission-breakdown {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          margin-top: 12px;
        }

        .commission-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .commission-row:last-child {
          margin-bottom: 0;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
          font-weight: 600;
        }

        .commission-row label {
          color: #666;
        }

        .commission-row value {
          color: #1a1a1a;
          font-weight: 500;
        }

        .timeline {
          margin-top: 16px;
        }

        .timeline-item {
          display: flex;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .timeline-item:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .timeline-marker {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          margin-right: 12px;
          margin-top: 4px;
          flex-shrink: 0;
        }

        .timeline-content {
          flex: 1;
        }

        .timeline-title {
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 2px;
        }

        .timeline-time {
          font-size: 12px;
          color: #999;
        }

        .dispute-section {
          background: #fee2e2;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
          margin-top: 12px;
        }

        .dispute-section h4 {
          margin: 0 0 8px 0;
          color: #991b1b;
          font-size: 14px;
        }

        .dispute-section p {
          margin: 0;
          font-size: 13px;
          color: #7f1d1d;
          line-height: 1.5;
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

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #1a1a1a;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }
      `}</style>

      <div className="payment-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transaction Details</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button 
            className={`modal-tab ${activeTab === 'breakdown' ? 'active' : ''}`}
            onClick={() => setActiveTab('breakdown')}
          >
            Commission Breakdown
          </button>
          <button 
            className={`modal-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'details' && (
            <>
              <div className="details-section">
                <h3>Basic Information</h3>
                <div className="details-grid">
                  <div className="detail-row">
                    <label>Transaction ID</label>
                    <value>{transaction._id}</value>
                  </div>
                  <div className="detail-row">
                    <label>Status</label>
                    <value>
                      <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                        {transaction.status}
                      </span>
                    </value>
                  </div>
                  <div className="detail-row">
                    <label>Amount</label>
                    <value>${transaction.amount.toFixed(2)}</value>
                  </div>
                  <div className="detail-row">
                    <label>Date</label>
                    <value>{new Date(transaction.createdAt).toLocaleDateString()}</value>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Parties Involved</h3>
                <div className="details-grid">
                  <div className="detail-row">
                    <label>Student</label>
                    <value>{transaction.studentName}</value>
                  </div>
                  <div className="detail-row">
                    <label>Host</label>
                    <value>{transaction.hostName}</value>
                  </div>
                  <div className="detail-row full-width">
                    <label>Class</label>
                    <value>{transaction.className}</value>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Reference Numbers</h3>
                <div className="details-grid">
                  <div className="detail-row">
                    <label>Stripe Intent ID</label>
                    <value style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                      {transaction.stripePaymentIntentId?.substring(0, 20)}...
                    </value>
                  </div>
                  <div className="detail-row">
                    <label>Access Code</label>
                    <value>{transaction.accessCode || 'N/A'}</value>
                  </div>
                </div>
              </div>

              {transaction.dispute && (
                <div className="dispute-section">
                  <h4>⚠️ Dispute Filed</h4>
                  <p>{transaction.dispute.reason}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'breakdown' && (
            <>
              <div className="details-section">
                <h3>Financial Breakdown</h3>
                <div className="commission-breakdown">
                  <div className="commission-row">
                    <label>Gross Amount</label>
                    <value>${transaction.amount.toFixed(2)}</value>
                  </div>
                  <div className="commission-row">
                    <label>Platform Commission</label>
                    <value>-${transaction.platformFee.toFixed(2)}</value>
                  </div>
                  <div className="commission-row">
                    <label>Stripe Fee (2.9% + $0.30)</label>
                    <value>-${stripeFee.toFixed(2)}</value>
                  </div>
                  <div className="commission-row">
                    <label>Host Earnings</label>
                    <value>${hostEarnings.toFixed(2)}</value>
                  </div>
                </div>
              </div>

              <div className="details-section">
                <h3>Commission Details</h3>
                <div className="details-grid">
                  <div className="detail-row">
                    <label>Host Plan Tier</label>
                    <value>{transaction.hostPlanTier}</value>
                  </div>
                  <div className="detail-row">
                    <label>Commission Rate</label>
                    <value>
                      {transaction.commissionRate || 
                        (transaction.hostPlanTier === 'starter' ? '25%' : 
                         transaction.hostPlanTier === 'growth' ? '20%' : 
                         transaction.hostPlanTier === 'pro' ? '15%' : '10%')}
                    </value>
                  </div>
                  <div className="detail-row">
                    <label>Days Enrolled</label>
                    <value>{transaction.daysEnrolled} days</value>
                  </div>
                  <div className="detail-row">
                    <label>Pricing Multiplier</label>
                    <value>
                      {transaction.daysEnrolled <= 3 ? '1.8x' :
                       transaction.daysEnrolled <= 6 ? '1.5x' :
                       transaction.daysEnrolled <= 13 ? '1.25x' :
                       transaction.daysEnrolled <= 20 ? '1.1x' : '1.0x'}
                    </value>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'timeline' && (
            <>
              <div className="details-section">
                <h3>Transaction History</h3>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-title">Transaction Created</div>
                      <div className="timeline-time">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {transaction.status === 'completed' && (
                    <>
                      <div className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-title">Payment Confirmed</div>
                          <div className="timeline-time">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <div className="timeline-title">Access Granted</div>
                          <div className="timeline-time">
                            {new Date(transaction.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {transaction.refundProcessedAt && (
                    <div className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-title">Refund Processed</div>
                        <div className="timeline-time">
                          {new Date(transaction.refundProcessedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h3>Payment Method</h3>
                <div className="details-grid">
                  <div className="detail-row">
                    <label>Last 4 Digits</label>
                    <value>••••{transaction.paymentMethodLast4 || '••••'}</value>
                  </div>
                  <div className="detail-row">
                    <label>Card Brand</label>
                    <value>{transaction.cardBrand || 'Visa'}</value>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          {transaction.status === 'pending' && (
            <>
              <button className="btn btn-primary">Confirm Payment</button>
              <button className="btn btn-danger">Cancel Payment</button>
            </>
          )}
          {transaction.status === 'completed' && (
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          )}
          {transaction.status === 'failed' && (
            <button className="btn btn-danger">Retry Payment</button>
          )}
        </div>
      </div>
    </div>
  );
}
