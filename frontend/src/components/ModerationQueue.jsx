import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import MessageBanner from '../components/MessageBanner';
import PromptDialog from '../components/PromptDialog';
import '../styles/ModerationQueue.css';

const ModerationQueue = () => {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [bulkDecision, setBulkDecision] = useState('');
  const [severity, setSeverity] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [appealStatus, setAppealStatus] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptContext, setPromptContext] = useState(null);

  const fetchQueue = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/moderation/queue/advanced', {
        params: {
          page,
          limit: 10,
          contentType: filterType,
          severity: severity || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          userId: userFilter || undefined,
          appealStatus: appealStatus || undefined,
        },
      });

      setQueue(response.data.logs);
      setCurrentPage(response.data.pagination.page);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching moderation queue:', err);
      setError('Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(1);
  }, [filterType, severity, dateFrom, dateTo, userFilter, appealStatus]);

  const handleDecision = (id, decision) => {
    setPromptContext({ type: 'single', id, decision });
    setPromptOpen(true);
  };

  const doDecision = async (reason) => {
    if (!reason) return;
    setPromptOpen(false);
    const { id, decision } = promptContext || {};
    try {
      await api.post(`/moderation/${id}/decide`, { decision, reason });
      fetchQueue(currentPage);
      setSuccess(`Item ${decision} successfully`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error processing decision:', err);
      setError('Failed to process decision');
    }
  };

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDecision = () => {
    if (selectedItems.size === 0) {
      setError('Please select items to process');
      return;
    }

    if (!bulkDecision) {
      setError('Please select a decision');
      return;
    }

    setPromptContext({ type: 'bulk' });
    setPromptOpen(true);
  };

  const doBulkDecision = async (reason) => {
    if (!reason) return;
    setPromptOpen(false);
    try {
      const decisions = Array.from(selectedItems).map(id => ({
        id,
        decision: bulkDecision,
        reason,
      }));

      await api.post('/moderation/bulk-decide', { decisions });

      setSelectedItems(new Set());
      setBulkDecision('');
      fetchQueue(currentPage);
      setSuccess('Bulk decision processed successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error processing bulk decision:', err);
      setError('Failed to process bulk decision');
    }
  };

  if (loading && queue.length === 0) {
    return <div className="moderation-queue-loading">Loading...</div>;
  }

  const exportLogs = async (format = 'csv') => {
    try {
      const params = {
        format,
        status: 'reviewed_rejected',
        contentType: filterType || undefined,
        severity: severity || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        userId: userFilter || undefined,
      };
      const resp = await api.get('/moderation/export/logs', { params, responseType: 'blob' });
      const blob = new Blob([resp.data], { type: resp.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moderation_logs.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSuccess('Export complete');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to export logs', err);
      setError('Failed to export logs');
    }
  };

  return (
    <div className="moderation-queue">
      {error && (
        <MessageBanner type="error" title="Moderation" message={error} onClose={() => setError(null)} />
      )}
      {success && (
        <MessageBanner type="success" title="Moderation" message={success} onClose={() => setSuccess(null)} />
      )}

      <PromptDialog
        open={promptOpen}
        title={promptContext?.type === 'bulk' ? 'Bulk decision reason' : `Reason for ${promptContext?.decision}`}
        label="Reason"
        placeholder="Enter reason"
        onConfirm={(val) => promptContext?.type === 'bulk' ? doBulkDecision(val) : doDecision(val)}
        onCancel={() => setPromptOpen(false)}
        confirmLabel="Submit"
        cancelLabel="Cancel"
      />
      <div className="mq-header">
        <h2>Moderation Queue</h2>
        <div className="mq-controls">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="mq-filter"
          >
            <option value="">All Content Types</option>
            <option value="review">Reviews</option>
            <option value="chat_message">Chat Messages</option>
            <option value="profile">Profile Content</option>
          </select>

          <select value={severity} onChange={e => setSeverity(e.target.value)} className="mq-filter">
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mq-filter" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mq-filter" />

          <input type="text" placeholder="User ID" value={userFilter} onChange={e => setUserFilter(e.target.value)} className="mq-filter" />

          <select value={appealStatus} onChange={e => setAppealStatus(e.target.value)} className="mq-filter">
            <option value="">Any Appeal Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button className="mq-export-btn" onClick={() => exportLogs('csv')}>Export CSV</button>
          <button className="mq-export-btn" onClick={() => exportLogs('json')}>Export JSON</button>
        </div>
      </div>

      {selectedItems.size > 0 && (
        <div className="mq-bulk-actions">
          <p>{selectedItems.size} items selected</p>
          <select
            value={bulkDecision}
            onChange={e => setBulkDecision(e.target.value)}
            className="mq-bulk-select"
          >
            <option value="">Select Action</option>
            <option value="approved">Approve All</option>
            <option value="rejected">Reject All</option>
            <option value="escalated">Escalate All</option>
          </select>
          <button
            onClick={handleBulkDecision}
            className="mq-bulk-btn"
            disabled={!bulkDecision}
          >
            Process Bulk Decision
          </button>
        </div>
      )}

      <div className="mq-table-wrapper">
        {queue.length === 0 ? (
          <p className="mq-empty">No items in moderation queue</p>
        ) : (
          <table className="mq-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(queue.map(item => item._id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                  />
                </th>
                <th>User</th>
                <th>Content Type</th>
                <th>Categories</th>
                <th>Confidence</th>
                <th>Content</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(item => (
                <tr key={item._id} className={`mq-row mq-row--${item.flagged ? 'flagged' : 'clean'}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item._id)}
                      onChange={() => handleSelectItem(item._id)}
                    />
                  </td>
                  <td className="mq-user">
                    {item.userId?.firstName} {item.userId?.lastName}
                    <br />
                    <small>{item.userId?.email}</small>
                  </td>
                  <td>
                    <span className="mq-badge mq-badge--type">
                      {item.contentType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="mq-categories">
                      {Object.entries(item.categories || {}).map(([key, value]) =>
                        value ? (
                          <span key={key} className="mq-category">
                            {key}
                          </span>
                        ) : null
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`mq-confidence mq-confidence--${Math.round(item.confidence * 100)}`}>
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </td>
                  <td className="mq-content">
                    <p>{item.content.substring(0, 100)}...</p>
                    <small>Posted: {new Date(item.createdAt).toLocaleDateString()}</small>
                  </td>
                  <td className="mq-actions">
                    <button
                      onClick={() => handleDecision(item._id, 'approved')}
                      className="mq-btn mq-btn--approve"
                      title="Approve this content"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => handleDecision(item._id, 'rejected')}
                      className="mq-btn mq-btn--reject"
                      title="Reject this content"
                    >
                      ✗
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mq-pagination">
          <button
            onClick={() => fetchQueue(currentPage - 1)}
            disabled={currentPage === 1}
            className="mq-page-btn"
          >
            Previous
          </button>
          <span className="mq-page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => fetchQueue(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="mq-page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ModerationQueue;