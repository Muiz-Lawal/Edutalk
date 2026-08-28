import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import MessageBanner from '../components/MessageBanner';
import PromptDialog from '../components/PromptDialog';
import '../styles/ModerationPage.css';

const ModerationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('queue');
  const [moderationQueue, setModerationQueue] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: 'pending_review',
    contentType: '',
    severity: '',
    dateFrom: '',
    dateTo: '',
    appealStatus: '',
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [bulkAction, setBulkAction] = useState('approved');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptContext, setPromptContext] = useState(null);

  // Fetch moderation queue
  useEffect(() => {
    if (activeTab === 'queue') {
      fetchModerationQueue();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab, filters, pagination.page]);

  const fetchModerationQueue = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });

      const response = await api.get(`/moderation/queue/advanced?${params}`);
      setModerationQueue(response.data.logs);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
      });
      setSelectedItems([]);
    } catch (error) {
      console.error('Error fetching moderation queue:', error);
      setError('Unable to load moderation items. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      const response = await api.get('/moderation/stats?period=7d');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Unable to load moderation statistics. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleApproveReject = (logId, decision) => {
    setPromptContext({ type: 'single', logId, decision });
    setPromptOpen(true);
  };

  const doApproveReject = async (reason) => {
    if (reason === null || reason === undefined) return;
    setPromptOpen(false);
    const { logId, decision } = promptContext || {};

    try {
      await api.post(`/moderation/${logId}/decide`, { decision, reason });
      setSuccessMessage(`Content ${decision} successfully.`);
      setError('');
      fetchModerationQueue();
    } catch (err) {
      console.error('Error processing decision:', err);
      setError('Unable to process decision. Please try again.');
      setSuccessMessage('');
    }
  };

  const handleBulkAction = () => {
    if (selectedItems.length === 0) {
      setError('Please select items to process.');
      setSuccessMessage('');
      return;
    }

    setPromptContext({ type: 'bulk' });
    setPromptOpen(true);
  };

  const doBulkAction = async (reason) => {
    if (!reason) return;
    setPromptOpen(false);
    try {
      const decisions = selectedItems.map(id => ({ id, decision: bulkAction, reason }));
      await api.post('/moderation/bulk-decide', { decisions });
      setSuccessMessage(`Bulk ${bulkAction} operation completed.`);
      setError('');
      fetchModerationQueue();
    } catch (err) {
      console.error('Error bulk processing:', err);
      setError('Unable to complete the bulk moderation operation. Please try again.');
      setSuccessMessage('');
    }
  };

  const handleExport = () => {
    setPromptContext({ type: 'export', defaultValue: 'csv' });
    setPromptOpen(true);
  };

  const doExport = async (format) => {
    if (!format) return;
    setPromptOpen(false);
    try {
      setError('');
      setSuccessMessage('');
      const params = new URLSearchParams({
        format,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      });

      const response = await api.get(`/moderation/export/logs?${params}`, {
        responseType: format === 'csv' ? 'blob' : 'json',
      });

      const data = format === 'csv'
        ? response.data
        : JSON.stringify(response.data, null, 2);
      const blob = new Blob([data], { type: format === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `moderation_logs.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
      setSuccessMessage('Moderation logs exported successfully.');
    } catch (err) {
      console.error('Error exporting logs:', err);
      setError('Error exporting logs. Please try again.');
      setSuccessMessage('');
    }
  };

  if (!user?.isHost) {
    return <div className="moderation-page">Access denied. Host privileges required.</div>;
  }

  return (
    <div className="moderation-page">
      <div className="moderation-header">
        <h1>🛡️ Content Moderation</h1>
        <button onClick={handleExport} className="export-btn">
          📥 Export Logs
        </button>
      </div>

      <div className="moderation-tabs">
        <button
          className={`tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          Queue & Actions
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
      </div>

      {error && (
        <MessageBanner
          type="error"
          title="Moderation action failed"
          message={error}
          onClose={() => setError('')}
        />
      )}
      {successMessage && (
        <MessageBanner
          type="success"
          title="Action completed"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}

      <PromptDialog
        open={promptOpen}
        title={promptContext?.type === 'export' ? 'Export format' : promptContext?.type === 'bulk' ? `Reason for ${bulkAction}` : `Reason for ${promptContext?.decision}`}
        defaultValue={promptContext?.defaultValue}
        label={promptContext?.type === 'export' ? 'Format (csv or json)' : 'Reason'}
        placeholder={promptContext?.type === 'export' ? 'csv or json' : 'Enter reason'}
        onConfirm={(val) => {
          if (promptContext?.type === 'export') return doExport(val);
          if (promptContext?.type === 'bulk') return doBulkAction(val);
          return doApproveReject(val);
        }}
        onCancel={() => setPromptOpen(false)}
        confirmLabel="Submit"
        cancelLabel="Cancel"
      />

      {activeTab === 'queue' && (
        <div className="moderation-queue">
          <div className="filter-section">
            <h3>Filters</h3>
            <div className="filter-grid">
              <div className="filter-group">
                <label>Status:</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="auto_approved">Auto Approved</option>
                  <option value="auto_blocked">Auto Blocked</option>
                  <option value="reviewed_approved">Reviewed & Approved</option>
                  <option value="reviewed_rejected">Reviewed & Rejected</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Content Type:</label>
                <select
                  name="contentType"
                  value={filters.contentType}
                  onChange={handleFilterChange}
                >
                  <option value="">All Types</option>
                  <option value="review">Review</option>
                  <option value="chat_message">Chat Message</option>
                  <option value="class_description">Class Description</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Severity:</label>
                <select
                  name="severity"
                  value={filters.severity}
                  onChange={handleFilterChange}
                >
                  <option value="">All Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Appeal Status:</label>
                <select
                  name="appealStatus"
                  value={filters.appealStatus}
                  onChange={handleFilterChange}
                >
                  <option value="">All</option>
                  <option value="pending">Pending Appeal</option>
                  <option value="approved">Appeal Approved</option>
                  <option value="rejected">Appeal Rejected</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Date From:</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="filter-group">
                <label>Date To:</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>

          {selectedItems.length > 0 && (
            <div className="bulk-action-bar">
              <span>{selectedItems.length} items selected</span>
              <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}>
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
              <button onClick={handleBulkAction} className="bulk-action-btn">
                Apply Action
              </button>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading...</div>
          ) : moderationQueue.length === 0 ? (
            <div className="empty-state">No items to moderate</div>
          ) : (
            <>
              <table className="moderation-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(moderationQueue.map(item => item._id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                      />
                    </th>
                    <th>User</th>
                    <th>Type</th>
                    <th>Content</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Appeal</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {moderationQueue.map(log => (
                    <tr key={log._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(log._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, log._id]);
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== log._id));
                            }
                          }}
                        />
                      </td>
                      <td>
                        <strong>{log.userId?.firstName} {log.userId?.lastName}</strong>
                        <br />
                        <small>{log.userId?.email}</small>
                      </td>
                      <td>
                        <span className="badge">{log.contentType.replace(/_/g, ' ')}</span>
                      </td>
                      <td>
                        <div className="content-preview">{log.content.substring(0, 50)}...</div>
                      </td>
                      <td>
                        <span className={`severity severity-${log.severity || 'low'}`}>
                          {log.severity || 'low'}
                        </span>
                      </td>
                      <td>
                        <span className={`status status-${log.status}`}>
                          {log.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {log.appeal?.status && log.appeal.status !== 'none' ? (
                          <span className={`appeal-badge appeal-${log.appeal.status}`}>
                            {log.appeal.status}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="actions">
                        {log.status === 'pending_review' && (
                          <>
                            <button
                              onClick={() => handleApproveReject(log._id, 'approved')}
                              className="action-btn approve"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleApproveReject(log._id, 'rejected')}
                              className="action-btn reject"
                            >
                              ✕
                            </button>
                          </>
                        )}
                        {log.appeal?.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveReject(log._id, 'approved')}
                              className="action-btn approve-appeal"
                              title="Approve Appeal"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleApproveReject(log._id, 'rejected')}
                              className="action-btn reject-appeal"
                              title="Reject Appeal"
                            >
                              👎
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <div className="moderation-stats">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Content</h3>
              <p className="stat-value">{stats.totalContent}</p>
            </div>
            <div className="stat-card">
              <h3>Flagged Content</h3>
              <p className="stat-value">{stats.flaggedContent}</p>
              <p className="stat-rate">{stats.flaggedRate}</p>
            </div>
            <div className="stat-card">
              <h3>Human Review Rate</h3>
              <p className="stat-value">{stats.humanReviewRate}</p>
            </div>
          </div>

          <div className="breakdown">
            <h3>Moderation Breakdown ({stats.period})</h3>
            <div className="breakdown-items">
              <div className="breakdown-item">
                <span>Auto Approved:</span>
                <strong>{stats.breakdown.autoApproved}</strong>
              </div>
              <div className="breakdown-item">
                <span>Auto Blocked:</span>
                <strong>{stats.breakdown.autoBlocked}</strong>
              </div>
              <div className="breakdown-item">
                <span>Human Approved:</span>
                <strong>{stats.breakdown.reviewedApproved}</strong>
              </div>
              <div className="breakdown-item">
                <span>Human Rejected:</span>
                <strong>{stats.breakdown.reviewedRejected}</strong>
              </div>
              <div className="breakdown-item">
                <span>Pending Review:</span>
                <strong>{stats.breakdown.pendingReview}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationPage;
