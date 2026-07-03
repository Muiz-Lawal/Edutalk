import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import PayoutManagementModal from '../components/PayoutManagementModal';
import RefundManagementModal from '../components/RefundManagementModal';
import '../styles/admin-payments.css';

const AdminPayments = () => {
  const { 
    fetchTransactions,
    fetchTransactionDetails,
    fetchRevenueByHost,
    fetchRevenueTrends,
    fetchPaymentSummary,
    fetchCommissionSettings,
    exportTransactions
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('transactions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Transaction state
  const [transactions, setTransactions] = useState([]);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionFilters, setTransactionFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    hostId: ''
  });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Revenue state
  const [revenueData, setRevenueData] = useState(null);
  const [hostRevenue, setHostRevenue] = useState([]);
  const [revenueTrends, setRevenueTrends] = useState([]);

  // Payout state
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedHost, setSelectedHost] = useState(null);

  // Refund state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  // Commission state
  const [commissionSettings, setCommissionSettings] = useState(null);

  // Summary state
  const [paymentSummary, setPaymentSummary] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'transactions') {
        const result = await fetchTransactions(transactionPage, transactionFilters);
        setTransactions(result?.data || []);
      } else if (activeTab === 'revenue') {
        const hostRevResult = await fetchRevenueByHost();
        const trendsResult = await fetchRevenueTrends();
        setHostRevenue(hostRevResult?.data || []);
        setRevenueTrends(trendsResult?.data || []);
      } else if (activeTab === 'payouts') {
        const summaryResult = await fetchPaymentSummary();
        setPaymentSummary(summaryResult?.data || null);
      } else if (activeTab === 'settings') {
        const settingsResult = await fetchCommissionSettings();
        setCommissionSettings(settingsResult?.data || null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading payments data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = async (transaction) => {
    try {
      const result = await fetchTransactionDetails(transaction._id);
      setSelectedTransaction(result?.data || transaction);
      setShowTransactionModal(true);
    } catch (err) {
      setError('Failed to load transaction details');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setTransactionFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setTransactionPage(1);
  };

  const handleExport = async () => {
    try {
      const result = await exportTransactions(transactionFilters);
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([result.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transactions-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (err) {
      setError('Failed to export transactions');
    }
  };

  return (
    <div className="admin-payments">
      <style>{`
        .admin-payments {
          padding: 30px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .payments-header {
          margin-bottom: 30px;
        }

        .payments-header h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin: 0 0 10px 0;
        }

        .payments-header p {
          color: #666;
          margin: 0;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .summary-card h3 {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin: 0 0 10px 0;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .summary-card .value {
          font-size: 32px;
          color: #1a1a1a;
          font-weight: bold;
          margin: 0;
        }

        .summary-card .change {
          font-size: 12px;
          color: #666;
          margin-top: 8px;
        }

        .summary-card .change.positive {
          color: #22c55e;
        }

        .summary-card .change.negative {
          color: #ef4444;
        }

        .tab-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-button {
          padding: 12px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          transition: all 0.3s ease;
        }

        .tab-button:hover {
          color: #1a1a1a;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-content {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .filter-bar {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-group input,
        .filter-group select {
          padding: 8px 12px;
          background: #ffffff;
          color: #1a1a1a;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
        }

        .filter-group input::placeholder {
          color: #9ca3af;
          opacity: 1;
        }

        .filter-group input:focus,
        .filter-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .data-table thead {
          background: #f9fafb;
          border-bottom: 2px solid #e5e7eb;
        }

        .data-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }

        .data-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #1a1a1a;
        }

        .data-table tbody tr:hover {
          background: #f9fafb;
          cursor: pointer;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
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

        .action-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .btn {
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

        .revenue-chart {
          margin-top: 20px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 6px;
        }

        .revenue-chart h3 {
          margin-top: 0;
          color: #1a1a1a;
        }

        .pagination {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 20px;
        }

        .pagination button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .pagination button:hover:not(:disabled) {
          background: #f9fafb;
        }

        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          background: #fee2e2;
          color: #991b1b;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
          border-left: 4px solid #dc2626;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 300px;
          font-size: 16px;
          color: #666;
        }

        .empty-state {
          text-align: center;
          padding: 40px;
          color: #999;
        }

        .empty-state p {
          margin: 10px 0;
        }
      `}</style>

      <div className="payments-header">
        <h1>💰 Payments & Payouts</h1>
        <p>Manage transactions, revenue, and commission settings</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Summary Cards */}
      {paymentSummary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Revenue</h3>
            <p className="value">${(paymentSummary.totalRevenue || 0).toFixed(2)}</p>
            <p className="change positive">↑ 12% vs last month</p>
          </div>
          <div className="summary-card">
            <h3>Platform Commission</h3>
            <p className="value">${(paymentSummary.platformCommission || 0).toFixed(2)}</p>
            <p className="change">Avg {paymentSummary.avgCommissionRate}% rate</p>
          </div>
          <div className="summary-card">
            <h3>Host Earnings</h3>
            <p className="value">${(paymentSummary.hostEarnings || 0).toFixed(2)}</p>
            <p className="change">Across {paymentSummary.activeHosts} hosts</p>
          </div>
          <div className="summary-card">
            <h3>Pending Payouts</h3>
            <p className="value">${(paymentSummary.pendingPayouts || 0).toFixed(2)}</p>
            <p className="change">{paymentSummary.pendingPayoutCount} scheduled</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          📊 Transactions
        </button>
        <button 
          className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          📈 Revenue Analysis
        </button>
        <button 
          className={`tab-button ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          💳 Payouts
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {loading && <div className="loading-spinner">Loading...</div>}

        {/* Transactions Tab */}
        {!loading && activeTab === 'transactions' && (
          <div>
            <div className="action-buttons">
              <button className="btn btn-secondary" onClick={handleExport}>
                📥 Export CSV
              </button>
            </div>

            <div className="filter-bar">
              <div className="filter-group">
                <label>Status</label>
                <select name="status" value={transactionFilters.status} onChange={handleFilterChange}>
                  <option value="all">All</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  name="startDate" 
                  value={transactionFilters.startDate} 
                  onChange={handleFilterChange} 
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input 
                  type="date" 
                  name="endDate" 
                  value={transactionFilters.endDate} 
                  onChange={handleFilterChange} 
                />
              </div>
              <div className="filter-group">
                <label>Min Amount</label>
                <input 
                  type="number" 
                  name="minAmount" 
                  placeholder="0.00"
                  value={transactionFilters.minAmount} 
                  onChange={handleFilterChange} 
                />
              </div>
              <div className="filter-group">
                <label>Max Amount</label>
                <input 
                  type="number" 
                  name="maxAmount" 
                  placeholder="0.00"
                  value={transactionFilters.maxAmount} 
                  onChange={handleFilterChange} 
                />
              </div>
            </div>

            {transactions.length > 0 ? (
              <>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Student</th>
                        <th>Host</th>
                        <th>Amount</th>
                        <th>Platform Fee</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx._id} onClick={() => handleTransactionClick(tx)}>
                          <td>{tx._id.substring(0, 8)}...</td>
                          <td>{tx.studentName}</td>
                          <td>{tx.hostName}</td>
                          <td>${tx.amount.toFixed(2)}</td>
                          <td>${tx.platformFee.toFixed(2)}</td>
                          <td>
                            <span className={`status-badge ${tx.status.toLowerCase()}`}>
                              {tx.status}
                            </span>
                          </td>
                          <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <button 
                    onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                    disabled={transactionPage === 1}
                  >
                    ← Previous
                  </button>
                  <span>Page {transactionPage}</span>
                  <button onClick={() => setTransactionPage(p => p + 1)}>
                    Next →
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No transactions found</p>
              </div>
            )}
          </div>
        )}

        {/* Revenue Analysis Tab */}
        {!loading && activeTab === 'revenue' && (
          <div>
            <div className="revenue-chart">
              <h3>Revenue Trends</h3>
              <p>{revenueTrends.length} data points</p>
              <div style={{ marginTop: '20px', color: '#666' }}>
                {revenueTrends.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Revenue</th>
                        <th>Transactions</th>
                        <th>Avg Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueTrends.map((trend, idx) => (
                        <tr key={idx}>
                          <td>{trend.period}</td>
                          <td>${trend.totalRevenue.toFixed(2)}</td>
                          <td>{trend.transactionCount}</td>
                          <td>${(trend.totalRevenue / trend.transactionCount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No revenue data available</p>
                )}
              </div>
            </div>

            <div className="revenue-chart">
              <h3>Revenue by Host</h3>
              {hostRevenue.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Host</th>
                      <th>Total Revenue</th>
                      <th>Classes</th>
                      <th>Students</th>
                      <th>Commission Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hostRevenue.map(host => (
                      <tr key={host._id}>
                        <td>{host.hostName}</td>
                        <td>${host.totalRevenue.toFixed(2)}</td>
                        <td>{host.classCount}</td>
                        <td>{host.studentCount}</td>
                        <td>{host.commissionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No host revenue data available</p>
              )}
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {!loading && activeTab === 'payouts' && (
          <div>
            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={() => setShowPayoutModal(true)}
              >
                + Process Payout
              </button>
            </div>

            <div className="empty-state">
              <p>Payout management interface ready</p>
              <p>Click "Process Payout" to create new payouts</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {!loading && activeTab === 'settings' && (
          <div>
            {commissionSettings ? (
              <div className="filter-bar">
                <div className="filter-group">
                  <label>Starter Commission Rate (%)</label>
                  <input type="number" defaultValue={commissionSettings.starter} />
                </div>
                <div className="filter-group">
                  <label>Growth Commission Rate (%)</label>
                  <input type="number" defaultValue={commissionSettings.growth} />
                </div>
                <div className="filter-group">
                  <label>Pro Commission Rate (%)</label>
                  <input type="number" defaultValue={commissionSettings.pro} />
                </div>
                <div className="filter-group">
                  <label>Elite Commission Rate (%)</label>
                  <input type="number" defaultValue={commissionSettings.elite} />
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>Commission settings loading...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTransactionModal && (
        <PaymentDetailsModal 
          transaction={selectedTransaction}
          onClose={() => setShowTransactionModal(false)}
        />
      )}

      {showPayoutModal && (
        <PayoutManagementModal 
          onClose={() => setShowPayoutModal(false)}
        />
      )}

      {showRefundModal && (
        <RefundManagementModal 
          transaction={selectedRefund}
          onClose={() => setShowRefundModal(false)}
        />
      )}
    </div>
  );
};

export { AdminPayments };
