import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { AdminLayout } from '../components/AdminLayout';
import '../styles/admin.css';

export const AdminLogs = () => {
  const { fetchAdminLogs, loading, error } = useAdmin();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [action, setAction] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = async (page = 1, filters = {}) => {
    const result = await fetchAdminLogs(page, 50, filters);
    if (result) {
      setLogs(result.logs);
      setPagination(result.pagination);
    }
  };

  useEffect(() => {
    loadLogs(1, { action });
  }, [action]);

  return (
    <AdminLayout>
      <div className="admin-page">
        <h1>Audit Logs</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="search-bar">
          <select value={action} onChange={(e) => setAction(e.target.value)} className="search-input">
            <option value="">All Actions</option>
            <option value="user_suspended">User Suspended</option>
            <option value="user_deleted">User Deleted</option>
            <option value="host_approved">Host Approved</option>
            <option value="class_removed">Class Removed</option>
            <option value="settings_updated">Settings Updated</option>
          </select>
        </div>

        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Admin</th>
                <th>Target</th>
                <th>Reason</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span className="status-badge active">{log.action}</span>
                  </td>
                  <td>{log.adminEmail}</td>
                  <td>{log.targetEmail || log.targetId}</td>
                  <td>{log.details?.reason || '-'}</td>
                  <td>{new Date(log.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div className="pagination">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={page === currentPage ? 'active' : ''}
                onClick={() => {
                  setCurrentPage(page);
                  loadLogs(page, { action });
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
