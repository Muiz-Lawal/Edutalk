import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import HostDetailsModal from '../components/HostDetailsModal';
import HostApprovalModal from '../components/HostApprovalModal';
import HostSuspensionModal from '../components/HostSuspensionModal';
import '../styles/admin-hosts.css';

const AdminHosts = () => {
  const {
    fetchAllHosts,
    fetchPendingHosts,
    fetchTopPerformers,
    fetchAtRiskHosts,
    fetchHostDetails,
    fetchHostPerformance
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // All hosts state
  const [hosts, setHosts] = useState([]);
  const [hostPage, setHostPage] = useState(1);
  const [hostFilters, setHostFilters] = useState({
    status: 'all',
    search: ''
  });

  // Pending hosts
  const [pendingHosts, setPendingHosts] = useState([]);

  // Top performers
  const [topPerformers, setTopPerformers] = useState([]);

  // At-risk hosts
  const [atRiskHosts, setAtRiskHosts] = useState([]);

  // Modal state
  const [selectedHost, setSelectedHost] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState('approve'); // 'approve' or 'reject'
  const [suspensionAction, setSuspensionAction] = useState('suspend'); // 'suspend' or 'unsuspend'

  // Load data on mount and tab change
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'all') {
        const result = await fetchAllHosts(hostPage, hostFilters);
        setHosts(result?.data || []);
      } else if (activeTab === 'pending') {
        const result = await fetchPendingHosts();
        setPendingHosts(result?.data || []);
      } else if (activeTab === 'top-performers') {
        const result = await fetchTopPerformers();
        setTopPerformers(result?.data || []);
      } else if (activeTab === 'at-risk') {
        const result = await fetchAtRiskHosts();
        setAtRiskHosts(result?.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading host data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHostClick = async (host) => {
    try {
      const details = await fetchHostDetails(host._id || host.hostId);
      const performance = await fetchHostPerformance(host._id || host.hostId);
      setSelectedHost({ ...details.host, ...performance });
      setShowDetailsModal(true);
    } catch (err) {
      setError('Failed to load host details');
    }
  };

  const handleApprove = (host) => {
    setSelectedHost(host);
    setApprovalAction('approve');
    setShowApprovalModal(true);
  };

  const handleReject = (host) => {
    setSelectedHost(host);
    setApprovalAction('reject');
    setShowApprovalModal(true);
  };

  const handleSuspend = (host) => {
    setSelectedHost(host);
    setSuspensionAction('suspend');
    setShowSuspensionModal(true);
  };

  const handleUnsuspend = (host) => {
    setSelectedHost(host);
    setSuspensionAction('unsuspend');
    setShowSuspensionModal(true);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setHostFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setHostPage(1);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'suspended':
        return '#ef4444';
      case 'rejected':
        return '#6b7280';
      default:
        return '#3b82f6';
    }
  };

  const renderHostTable = (data, showActions = true) => {
    if (data.length === 0) {
      return <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No hosts found</div>;
    }

    return (
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Host Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Plan Tier</th>
              <th>Revenue</th>
              <th>Classes</th>
              <th>Students</th>
              <th>Rating</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map(host => (
              <tr key={host._id || host.hostId}>
                <td onClick={() => handleHostClick(host)} style={{ cursor: 'pointer', color: '#3b82f6' }}>
                  {host.hostName || host.name}
                </td>
                <td>{host.email}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{
                      background: getStatusColor(host.status),
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                  >
                    {host.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </td>
                <td>{host.planTier || 'Starter'}</td>
                <td>${(host.totalRevenue || 0).toFixed(2)}</td>
                <td>{host.classCount || 0}</td>
                <td>{host.studentCount || 0}</td>
                <td>
                  <span style={{ fontWeight: '600' }}>
                    ⭐ {(host.rating || 0).toFixed(1)}
                  </span>
                </td>
                {showActions && (
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {host.status === 'pending' && (
                        <>
                          <button
                            className="action-btn approve"
                            onClick={() => handleApprove(host)}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            className="action-btn reject"
                            onClick={() => handleReject(host)}
                            title="Reject"
                          >
                            ✕
                          </button>
                        </>
                      )}
                      {host.status === 'approved' && (
                        <button
                          className="action-btn suspend"
                          onClick={() => handleSuspend(host)}
                          title="Suspend"
                        >
                          🔒
                        </button>
                      )}
                      {host.status === 'suspended' && (
                        <button
                          className="action-btn unsuspend"
                          onClick={() => handleUnsuspend(host)}
                          title="Unsuspend"
                        >
                          🔓
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-hosts">
      <style>{`
        .admin-hosts {
          padding: 30px;
          background: #f5f7fa;
          min-height: 100vh;
        }

        .hosts-header {
          margin-bottom: 30px;
        }

        .hosts-header h1 {
          font-size: 28px;
          color: #1a1a1a;
          margin: 0 0 10px 0;
          font-weight: 700;
        }

        .hosts-header p {
          color: #666;
          margin: 0;
          font-size: 14px;
        }

        .tab-navigation {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          border-bottom: 1px solid #e5e7eb;
          background: white;
          border-radius: 8px 8px 0 0;
          padding: 0 20px;
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
          border-radius: 0 0 8px 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .table-wrapper {
          overflow-x: auto;
          margin-bottom: 20px;
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

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn.approve {
          background: #dcfce7;
          color: #166534;
        }

        .action-btn.approve:hover {
          background: #bbf7d0;
        }

        .action-btn.reject {
          background: #fee2e2;
          color: #991b1b;
        }

        .action-btn.reject:hover {
          background: #fecaca;
        }

        .action-btn.suspend {
          background: #fef3c7;
          color: #92400e;
        }

        .action-btn.suspend:hover {
          background: #fde68a;
        }

        .action-btn.unsuspend {
          background: #dbeafe;
          color: #1e40af;
        }

        .action-btn.unsuspend:hover {
          background: #bfdbfe;
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
          transition: all 0.3s ease;
        }

        .pagination button:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #3b82f6;
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

        .stat-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .stat-card .value {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }

        .stat-card.pending {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .stat-card.suspended {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .stat-card.approved {
          background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
        }
      `}</style>

      <div className="hosts-header">
        <h1>👥 Host Management</h1>
        <p>Manage host approvals, performance, and activity</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          👥 All Hosts
        </button>
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Pending Approval
        </button>
        <button
          className={`tab-button ${activeTab === 'top-performers' ? 'active' : ''}`}
          onClick={() => setActiveTab('top-performers')}
        >
          🏆 Top Performers
        </button>
        <button
          className={`tab-button ${activeTab === 'at-risk' ? 'active' : ''}`}
          onClick={() => setActiveTab('at-risk')}
        >
          ⚠️ At-Risk
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {loading && <div className="loading-spinner">Loading...</div>}

        {/* All Hosts Tab */}
        {!loading && activeTab === 'all' && (
          <div>
            <div className="filter-bar">
              <div className="filter-group">
                <label>Status</label>
                <select name="status" value={hostFilters.status} onChange={handleFilterChange}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="suspended">Suspended</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Search</label>
                <input
                  type="text"
                  name="search"
                  value={hostFilters.search}
                  onChange={handleFilterChange}
                  placeholder="Host name or email..."
                />
              </div>
            </div>

            {renderHostTable(hosts, true)}

            <div className="pagination">
              <button
                onClick={() => setHostPage(p => Math.max(1, p - 1))}
                disabled={hostPage === 1}
              >
                ← Previous
              </button>
              <span>Page {hostPage}</span>
              <button onClick={() => setHostPage(p => p + 1)}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Pending Hosts Tab */}
        {!loading && activeTab === 'pending' && (
          <div>
            <div className="stat-cards">
              <div className="stat-card pending">
                <h3>Pending Applications</h3>
                <p className="value">{pendingHosts.length}</p>
              </div>
            </div>
            {renderHostTable(pendingHosts, true)}
          </div>
        )}

        {/* Top Performers Tab */}
        {!loading && activeTab === 'top-performers' && (
          <div>
            <div className="stat-cards">
              <div className="stat-card approved">
                <h3>Top Hosts</h3>
                <p className="value">{topPerformers.length}</p>
              </div>
            </div>
            {renderHostTable(topPerformers, false)}
          </div>
        )}

        {/* At-Risk Tab */}
        {!loading && activeTab === 'at-risk' && (
          <div>
            <div className="stat-cards">
              <div className="stat-card suspended">
                <h3>At-Risk Hosts</h3>
                <p className="value">{atRiskHosts.length}</p>
              </div>
            </div>
            {renderHostTable(atRiskHosts, true)}
          </div>
        )}
      </div>

      {/* Modals */}
      {showDetailsModal && selectedHost && (
        <HostDetailsModal
          host={selectedHost}
          onClose={() => setShowDetailsModal(false)}
          onApprove={() => {
            setApprovalAction('approve');
            setShowApprovalModal(true);
          }}
          onReject={() => {
            setApprovalAction('reject');
            setShowApprovalModal(true);
          }}
          onSuspend={() => {
            setSuspensionAction('suspend');
            setShowSuspensionModal(true);
          }}
          onUnsuspend={() => {
            setSuspensionAction('unsuspend');
            setShowSuspensionModal(true);
          }}
        />
      )}

      {showApprovalModal && selectedHost && (
        <HostApprovalModal
          host={selectedHost}
          action={approvalAction}
          onClose={() => setShowApprovalModal(false)}
          onSuccess={() => {
            setShowApprovalModal(false);
            setShowDetailsModal(false);
            loadTabData();
          }}
        />
      )}

      {showSuspensionModal && selectedHost && (
        <HostSuspensionModal
          host={selectedHost}
          action={suspensionAction}
          onClose={() => setShowSuspensionModal(false)}
          onSuccess={() => {
            setShowSuspensionModal(false);
            setShowDetailsModal(false);
            loadTabData();
          }}
        />
      )}
    </div>
  );
};

export { AdminHosts };
