import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

const AuditLogViewer = ({ logs: initialLogs }) => {
  const { fetchAuditLogs, exportAuditLogsPhase5G, loading } = useAdmin();
  const [logs, setLogs] = useState(initialLogs?.logs || []);
  const [filteredLogs, setFilteredLogs] = useState(logs);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('');

  // Get unique values for filters
  const uniqueActions = [...new Set(logs.map(l => l.action))];
  const uniqueAdmins = [...new Set(logs.map(l => l.adminEmail))];
  const uniqueStatuses = [...new Set(logs.map(l => l.status))];

  // Apply filters
  useEffect(() => {
    let filtered = logs;

    if (actionFilter) {
      filtered = filtered.filter(l => l.action === actionFilter);
    }

    if (adminFilter) {
      filtered = filtered.filter(l => l.adminEmail === adminFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(l => new Date(l.createdAt) >= startDate);
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59);
      filtered = filtered.filter(l => new Date(l.createdAt) <= endDate);
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, actionFilter, adminFilter, dateRange, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleLoadMore = async () => {
    const nextPage = currentPage + 1;
    const data = await fetchAuditLogs(nextPage, 50);
    if (data?.logs) {
      setLogs([...logs, ...data.logs]);
    }
  };

  const handleExport = async () => {
    const filters = {
      action: actionFilter,
      adminEmail: adminFilter,
      status: statusFilter,
      startDate: dateRange.start,
      endDate: dateRange.end
    };
    await exportAuditLogsPhase5G(filters);
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setAdminFilter('');
    setStatusFilter('');
    setDateRange({ start: '', end: '' });
  };

  const getActionIcon = (action) => {
    const icons = {
      'host_approved': '✅',
      'host_rejected': '❌',
      'host_suspended': '🔒',
      'content_rejected': '🚫',
      'content_approved': '✓',
      'user_suspended': '🔘',
      'commission_updated': '💰',
      'feature_toggled': '🚩',
      'template_updated': '📧',
    };
    return icons[action] || '📝';
  };

  const getStatusBadgeClass = (status) => {
    return `badge badge-${status.toLowerCase()}`;
  };

  return (
    <div className="audit-log-viewer">
      <h2>Audit Logs</h2>
      <p className="card-description">
        Track all administrative actions performed on the platform for compliance and security.
      </p>

      <div className="filters-section">
        <h3>Filters</h3>

        <div className="filter-grid">
          <div className="filter-group">
            <label>Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              disabled={loading}
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Admin</label>
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              disabled={loading}
            >
              <option value="">All Admins</option>
              {uniqueAdmins.map(admin => (
                <option key={admin} value={admin}>
                  {admin}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={loading}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              disabled={loading}
            />
          </div>

          <div className="filter-group filter-actions">
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              disabled={loading}
            >
              Clear Filters
            </button>
            <button
              onClick={handleExport}
              className="btn btn-primary btn-sm"
              disabled={loading || filteredLogs.length === 0}
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        <div className="filter-summary">
          Showing {paginatedLogs.length} of {filteredLogs.length} logs
        </div>
      </div>

      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log, index) => (
                <tr key={index} className={`log-row status-${log.status}`}>
                  <td className="timestamp">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="admin">
                    {log.adminEmail}
                  </td>
                  <td className="action">
                    <span className="action-icon">{getActionIcon(log.action)}</span>
                    {log.action}
                  </td>
                  <td className="target">
                    <div className="target-info">
                      <span className="target-type">{log.targetType}</span>
                      <span className="target-id">{log.targetId}</span>
                    </div>
                  </td>
                  <td>
                    <span className={getStatusBadgeClass(log.status)}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state">
                  No logs found matching the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && currentPage < totalPages && (
        <div className="pagination">
          <button
            onClick={handleLoadMore}
            className="btn btn-primary"
            disabled={loading}
          >
            Load More ({currentPage}/{totalPages})
          </button>
        </div>
      )}

      <div className="log-info">
        <h4>💡 Audit Log Information</h4>
        <ul>
          <li><strong>Timestamp:</strong> When the action was performed (UTC)</li>
          <li><strong>Admin:</strong> Email of the administrator who performed the action</li>
          <li><strong>Action:</strong> Type of action (approve, reject, suspend, etc.)</li>
          <li><strong>Target:</strong> Resource that was affected (User, Class, Host, etc.)</li>
          <li><strong>Status:</strong> Result of the action (success, error, pending)</li>
        </ul>
        <p className="info-note">
          All audit logs are retained for 1 year for compliance purposes. Export data for long-term archival.
        </p>
      </div>
    </div>
  );
};

export default AuditLogViewer;
