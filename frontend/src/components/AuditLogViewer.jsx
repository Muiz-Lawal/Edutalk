import React, { useState, useEffect } from 'react';
import { ClipboardList, Download } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const AuditLogViewer = ({ logs: initialLogs }) => {
  const { fetchAuditLogs, exportAuditLogsPhase5G, loading } = useAdmin();
  const [logs, setLogs] = useState(initialLogs?.logs || []);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [totalLogs, setTotalLogs] = useState(initialLogs?.total || 0);
  const [loadError, setLoadError] = useState('');
  
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    let active = true;
    const loadLogs = async () => {
      setLoadError('');
      const result = await fetchAuditLogs(currentPage, pageSize, {
        action: actionFilter.trim(),
        adminEmail: adminFilter.trim(),
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      if (!active) return;
      if (result?.logs) {
        setLogs((current) => currentPage === 1 ? result.logs : [...current, ...result.logs]);
        setTotalLogs(result.total || 0);
      } else {
        setLoadError('Audit logs could not be loaded. Please retry.');
      }
    };
    loadLogs();
    return () => { active = false; };
  }, [fetchAuditLogs, currentPage, pageSize, actionFilter, adminFilter, dateRange.start, dateRange.end]);

  const totalPages = Math.ceil(totalLogs / pageSize);

  const handleLoadMore = () => {
    if (currentPage < totalPages) setCurrentPage((page) => page + 1);
  };

  const handleExport = async () => {
    const filters = {
      action: actionFilter,
      adminEmail: adminFilter,
      startDate: dateRange.start,
      endDate: dateRange.end
    };
    await exportAuditLogsPhase5G(filters);
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setAdminFilter('');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  const formatTimestamp = (value) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(value));
    const part = (type) => parts.find((item) => item.type === type)?.value || '';
    return `${part('month')} ${part('day')}, ${part('year')} ${part('hour')}:${part('minute')}`;
  };

  const getStatusBadgeClass = (status) => {
    return `badge badge-${status.toLowerCase()}`;
  };
  const formatAuditValue = (value) => (
    typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
  );

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
            <input
              type="search"
              aria-label="Filter by action type"
              value={actionFilter}
              onChange={(event) => { setActionFilter(event.target.value); setCurrentPage(1); }}
              placeholder="Action type"
              disabled={loading}
            />
          </div>

          <div className="filter-group">
            <label>Actor</label>
            <input
              type="search"
              aria-label="Filter by actor"
              value={adminFilter}
              onChange={(e) => { setAdminFilter(e.target.value); setCurrentPage(1); }}
              placeholder="Name or email"
              disabled={loading}
            />
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => { setDateRange({ ...dateRange, start: e.target.value }); setCurrentPage(1); }}
              disabled={loading}
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => { setDateRange({ ...dateRange, end: e.target.value }); setCurrentPage(1); }}
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
              disabled={loading || totalLogs === 0}
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        </div>

        <div className="filter-summary">
          Showing {logs.length} of {totalLogs} logs
        </div>
      </div>

      {loadError && <p role="alert">{loadError}</p>}
      <div className="logs-table-container">
        <table className="logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <tr key={log._id} className={`log-row status-${log.status}`}>
                  <td className="timestamp">
                    {formatTimestamp(log.createdAt)}
                  </td>
                  <td className="admin">
                    {log.adminEmail || log.actorEmail || 'System administrator'}
                  </td>
                  <td className="action">
                    <span className="action-icon"><ClipboardList size={15} /></span>
                    {log.action}
                  </td>
                  <td className="target">
                    <div className="target-info">
                      <span className="target-type">{log.targetType}</span>
                      <span className="target-id">{log.targetId || log.details?.metadata?.target || '—'}</span>
                      {log.details?.previousValue !== undefined && log.details?.newValue !== undefined
                        && <span className="target-change">{formatAuditValue(log.details.previousValue)} → {formatAuditValue(log.details.newValue)}</span>}
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
        <h4>Audit Log Information</h4>
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
