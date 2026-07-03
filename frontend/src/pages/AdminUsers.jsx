import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { AdminLayout } from '../components/AdminLayout';
import UserDetailsModal from '../components/UserDetailsModal';
import AdminMessageModal from '../components/AdminMessageModal';
import '../styles/admin.css';

export const AdminUsers = () => {
  const { fetchUsers, suspendUser, unsuspendUser, deleteUser, loading, error } = useAdmin();
  
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalActive, setModalActive] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [reason, setReason] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // New modals for Phase 5C
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);
  const [messageUser, setMessageUser] = useState(null);

  const loadUsers = async (page = 1, filters = {}) => {
    const result = await fetchUsers(page, 20, filters);
    if (result) {
      setUsers(result.users);
      setPagination(result.pagination);
    }
  };

  useEffect(() => {
    loadUsers(1, { search, role, status });
  }, [search, role, status]);

  const handleSuspend = async () => {
    if (!selectedUser || !reason) {
      alert('Please enter a reason');
      return;
    }
    
    const result = await suspendUser(selectedUser._id, reason);
    if (result) {
      setSuccessMessage(`User ${selectedUser.email} suspended`);
      setModalActive(false);
      setReason('');
      loadUsers(currentPage, { search, role, status });
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleUnsuspend = async () => {
    if (!selectedUser) return;
    
    const result = await unsuspendUser(selectedUser._id);
    if (result) {
      setSuccessMessage(`User ${selectedUser.email} unsuspended`);
      setModalActive(false);
      loadUsers(currentPage, { search, role, status });
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser || !reason) {
      alert('Please enter a reason');
      return;
    }
    
    if (!window.confirm('Are you sure? This action cannot be undone.')) {
      return;
    }
    
    const result = await deleteUser(selectedUser._id, reason);
    if (result) {
      setSuccessMessage(`User ${selectedUser.email} deleted`);
      setModalActive(false);
      setReason('');
      loadUsers(1, { search, role, status });
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setActionType(type);
    setReason('');
    setModalActive(true);
  };

  const closeModal = () => {
    setModalActive(false);
    setSelectedUser(null);
    setActionType(null);
    setReason('');
  };

  // New handler for different action types from UserDetailsModal
  const handleModalAction = (action, user) => {
    if (action === 'suspend') {
      openModal(user, 'suspend');
    } else if (action === 'unsuspend') {
      openModal(user, 'unsuspend');
    } else if (action === 'delete') {
      openModal(user, 'delete');
    } else if (action === 'message') {
      setMessageUser(user);
      setMessageModalOpen(true);
    }
    setDetailsModalOpen(false);
  };

  const openDetailsModal = (user) => {
    setDetailsUser(user);
    setDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <h1>User Management</h1>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {/* Filters */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="search-input">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="host">Hosts</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="search-input">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>{`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</td>
                  <td>
                    {user.isHost && <span className="status-badge active">Host</span>}
                    {user.isStudent && <span className="status-badge pending">Student</span>}
                  </td>
                  <td>
                    {user.bannedAt ? (
                      <span className="status-badge banned">Banned</span>
                    ) : user.suspendedAt ? (
                      <span className="status-badge suspended">Suspended</span>
                    ) : (
                      <span className="status-badge active">Active</span>
                    )}
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => openDetailsModal(user)}
                      title="View details and activity"
                    >
                      Details
                    </button>
                    {user.suspendedAt ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => openModal(user, 'unsuspend')}
                      >
                        Unsuspend
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openModal(user, 'suspend')}
                      >
                        Suspend
                      </button>
                    )}
                    {!user.bannedAt && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openModal(user, 'delete')}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="pagination">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={page === currentPage ? 'active' : ''}
                onClick={() => {
                  setCurrentPage(page);
                  loadUsers(page, { search, role, status });
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}

        {/* Action Modal */}
        <div className={`modal ${modalActive ? 'active' : ''}`}>
          <div className="modal-content">
            <div className="modal-header">
              {actionType === 'suspend' && `Suspend User - ${selectedUser?.email}`}
              {actionType === 'unsuspend' && `Unsuspend User - ${selectedUser?.email}`}
              {actionType === 'delete' && `Delete User - ${selectedUser?.email}`}
            </div>
            <div className="modal-body">
              {(actionType === 'suspend' || actionType === 'delete') && (
                <div className="form-group">
                  <label>Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this action..."
                  />
                </div>
              )}
              {actionType === 'unsuspend' && (
                <p>Are you sure you want to unsuspend this user? They will regain access to their account.</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={closeModal}>
                Cancel
              </button>
              {actionType === 'suspend' && (
                <button className="btn btn-warning" onClick={handleSuspend}>
                  Suspend User
                </button>
              )}
              {actionType === 'unsuspend' && (
                <button className="btn btn-success" onClick={handleUnsuspend}>
                  Unsuspend User
                </button>
              )}
              {actionType === 'delete' && (
                <button className="btn btn-danger" onClick={handleDelete}>
                  Delete User
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Phase 5C: User Details Modal */}
        <UserDetailsModal
          user={detailsUser}
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          onAction={handleModalAction}
        />

        {/* Phase 5C: Admin Message Modal */}
        <AdminMessageModal
          user={messageUser}
          isOpen={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          onSuccess={() => {
            setSuccessMessage('Message sent successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />
      </div>
    </AdminLayout>
  );
};
