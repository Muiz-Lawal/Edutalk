import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import ContentReviewModal from '../components/ContentReviewModal';
import '../styles/admin.css';

const AdminModeration = () => {
  const { fetchModerationQueue, fetchModerationStats } = useAdmin();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({ reason: 'all' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Fetch moderation queue
  useEffect(() => {
    loadModerationQueue();
  }, [pagination, activeTab, filters]);

  // Fetch stats separately
  useEffect(() => {
    loadModerationStats();
  }, []);

  const loadModerationQueue = async () => {
    setLoading(true);
    try {
      const data = await fetchModerationQueue({
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === 'all' ? 'all' : activeTab,
        reason: filters.reason
      });
      if (data) {
        setQueue(data.queue || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      }
    } catch (error) {
      console.error('Error loading moderation queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModerationStats = async () => {
    try {
      const data = await fetchModerationStats();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading moderation stats:', error);
    }
  };

  const handleReview = (item) => {
    setSelectedContent(item);
    setReviewModalOpen(true);
  };

  const handleModalClose = () => {
    setReviewModalOpen(false);
    setSelectedContent(null);
    loadModerationQueue(); // Reload queue after action
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination({ page: 1, limit: 20 });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setPagination({ page: 1, limit: 20 });
  };

  const handlePagination = (page) => {
    setPagination({ ...pagination, page });
  };

  const reasons = [
    'Spam',
    'Inappropriate Content',
    'Fraud',
    'Copyright Violation',
    'Harassment',
    'Misinformation',
    'Other'
  ];

  return (
    <div className="admin-moderation-page">
      <style>{`
        .admin-moderation-page {
          padding: 20px;
          background: #f5f5f5;
        }

        .moderation-header {
          margin-bottom: 30px;
        }

        .moderation-header h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #333;
        }

        .moderation-header p {
          color: #666;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          text-align: center;
        }

        .stat-card .label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .stat-card .value {
          font-size: 32px;
          font-weight: 700;
          color: #333;
        }

        .tab-buttons {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
          overflow-x: auto;
        }

        .tab-button {
          padding: 12px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #999;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .tab-button.active {
          color: #1976d2;
          border-bottom-color: #1976d2;
        }

        .tab-button:hover {
          color: #333;
        }

        .filters-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
          align-items: flex-end;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
        }

        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          min-width: 150px;
        }

        .content-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table thead {
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .table th {
          padding: 15px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
        }

        .table td {
          padding: 15px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }

        .table tr:hover {
          background: #fafafa;
        }

        .class-title {
          font-weight: 500;
          color: #333;
        }

        .flag-count {
          display: inline-block;
          background: #ff4444;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-badge.pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.approved {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.rejected {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.suspended {
          background: #e2e3e5;
          color: #383d41;
        }

        .status-badge.removed {
          background: #f5c6cb;
          color: #721c24;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .btn-sm {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #1976d2;
          color: white;
        }

        .btn-primary:hover {
          background: #1565c0;
        }

        .btn-warning {
          background: #ff9800;
          color: white;
        }

        .btn-warning:hover {
          background: #f57c00;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover {
          background: #da190b;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
        }

        .spinner {
          border: 3px solid #f0f0f0;
          border-top: 3px solid #1976d2;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .pagination {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 20px;
          padding: 20px;
        }

        .pagination-button {
          padding: 8px 12px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
          border-radius: 4px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .pagination-button.active {
          background: #1976d2;
          color: white;
          border-color: #1976d2;
        }

        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-button:hover:not(:disabled) {
          border-color: #1976d2;
          color: #1976d2;
        }

        @media (max-width: 768px) {
          .filters-section {
            flex-direction: column;
          }

          .filter-group select {
            width: 100%;
            min-width: unset;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .table {
            font-size: 12px;
          }

          .table th,
          .table td {
            padding: 10px;
          }
        }
      `}</style>

      <div className="moderation-header">
        <h1>📋 Content Moderation Dashboard</h1>
        <p>Review and manage flagged classes and content</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Flagged</div>
            <div className="value">{stats.totalFlagged}</div>
          </div>
          <div className="stat-card">
            <div className="label">Pending Review</div>
            <div className="value">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <div className="label">Approved</div>
            <div className="value">{stats.approved}</div>
          </div>
          <div className="stat-card">
            <div className="label">Rejected</div>
            <div className="value">{stats.rejected}</div>
          </div>
          <div className="stat-card">
            <div className="label">Suspended</div>
            <div className="value">{stats.suspended}</div>
          </div>
          <div className="stat-card">
            <div className="label">Removed</div>
            <div className="value">{stats.removed}</div>
          </div>
        </div>
      )}

      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All ({stats?.totalFlagged || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          Pending ({stats?.pending || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => handleTabChange('approved')}
        >
          Approved ({stats?.approved || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => handleTabChange('rejected')}
        >
          Rejected ({stats?.rejected || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'suspended' ? 'active' : ''}`}
          onClick={() => handleTabChange('suspended')}
        >
          Suspended ({stats?.suspended || 0})
        </button>
        <button
          className={`tab-button ${activeTab === 'removed' ? 'active' : ''}`}
          onClick={() => handleTabChange('removed')}
        >
          Removed ({stats?.removed || 0})
        </button>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Reason</label>
          <select name="reason" value={filters.reason} onChange={handleFilterChange}>
            <option value="all">All Reasons</option>
            {reasons.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      ) : queue.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>No flagged content found</p>
        </div>
      ) : (
        <>
          <div className="content-table">
            <table className="table">
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Host</th>
                  <th>Reports</th>
                  <th>Reason</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(item => (
                  <tr key={item._id}>
                    <td className="class-title">{item.title}</td>
                    <td>{item.hostEmail}</td>
                    <td>
                      <span className="flag-count">{item.flagCount} reports</span>
                    </td>
                    <td>
                      {item.flags?.length > 0 ? (
                        <div style={{ fontSize: '12px' }}>
                          {item.flags.map((f, i) => (
                            <div key={i}>{f.reason}</div>
                          ))}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td>{item.totalStudents || 0}</td>
                    <td>
                      <span className={`status-badge ${item.moderationStatus || 'pending'}`}>
                        {(item.moderationStatus || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-sm btn-primary"
                          onClick={() => handleReview(item)}
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                className="pagination-button"
                disabled={pagination.page === 1}
                onClick={() => handlePagination(pagination.page - 1)}
              >
                ← Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum = pagination.page - 2 + i;
                if (pageNum < 1 || pageNum > pagination.pages) return null;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-button ${pageNum === pagination.page ? 'active' : ''}`}
                    onClick={() => handlePagination(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="pagination-button"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePagination(pagination.page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {reviewModalOpen && selectedContent && (
        <ContentReviewModal
          content={selectedContent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export { AdminModeration };
export default AdminModeration;
