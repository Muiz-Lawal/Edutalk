import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/AdminManagement.css';

const AdminManagement = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Create admin form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    adminRole: 'moderator',
  });

  // Edit admin form
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editData, setEditData] = useState({});

  // Change password form
  const [passwordChange, setPasswordChange] = useState({ adminId: null, newPassword: '' });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Fetch admins
  useEffect(() => {
    fetchAdmins();
  }, [page, search]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/admins', {
        params: {
          page,
          limit: 10,
          search,
        },
      });
      setAdmins(response.data.admins);
      setTotalPages(response.data.pages);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  // Create new admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/admin/admins/create', newAdmin);
      setSuccess('✅ Admin created successfully!');
      setNewAdmin({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        adminRole: 'moderator',
      });
      setShowCreateForm(false);
      fetchAdmins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create admin');
    }
  };

  // Start editing admin
  const startEdit = (admin) => {
    setEditingAdmin(admin._id);
    setEditData({
      firstName: admin.firstName,
      lastName: admin.lastName,
      adminRole: admin.adminRole,
    });
  };

  // Update admin
  const handleUpdateAdmin = async (adminId) => {
    try {
      await api.put(`/admin/admins/${adminId}`, editData);
      setSuccess('✅ Admin updated successfully!');
      setEditingAdmin(null);
      fetchAdmins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update admin');
    }
  };

  // Change admin password
  const handleChangePassword = async () => {
    try {
      await api.post(`/admin/admins/${passwordChange.adminId}/change-password`, {
        newPassword: passwordChange.newPassword,
      });
      setSuccess('✅ Password changed successfully!');
      setPasswordChange({ adminId: null, newPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }
  };

  // Delete admin
  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/admins/${adminId}`);
      setSuccess('✅ Admin deleted successfully!');
      fetchAdmins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete admin');
    }
  };

  // Check if user is superadmin
  if (!user?.isSuperAdmin) {
    return (
      <div className="admin-management-container">
        <div className="alert alert-error">
          ❌ Access Denied. SuperAdmin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="admin-management-container">
      <div className="admin-header">
        <h1>🔑 Admin Management</h1>
        <p>Create and manage admin accounts with different roles and privileges</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Create Admin Button */}
      <div className="admin-controls">
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Cancel' : '➕ Create New Admin'}
        </button>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search admins by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <div className="admin-form-card">
          <h2>➕ Create New Admin</h2>
          <form onSubmit={handleCreateAdmin}>
            <div className="form-row">
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                  placeholder="admin@example.com"
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  minLength="8"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  required
                  value={newAdmin.firstName}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, firstName: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  required
                  value={newAdmin.lastName}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, lastName: e.target.value })
                  }
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Admin Role *</label>
              <select
                value={newAdmin.adminRole}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, adminRole: e.target.value })
                }
              >
                <option value="moderator">🎯 Moderator - Content moderation & reviews</option>
                <option value="support">🛡️ Support - User support & refunds</option>
                <option value="admin">👤 Admin - Full admin access</option>
                <option value="superadmin">🔑 SuperAdmin - Full system access</option>
              </select>
            </div>

            <button type="submit" className="btn btn-success">
              ✅ Create Admin
            </button>
          </form>
        </div>
      )}

      {/* Admin List */}
      <div className="admin-list-card">
        <h2>📋 Admin Accounts ({admins.length})</h2>

        {loading ? (
          <div className="loading">⏳ Loading admins...</div>
        ) : admins.length === 0 ? (
          <div className="no-data">No admin accounts found</div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Type</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin._id} className="admin-row">
                      <td className="email-cell">{admin.email}</td>
                      <td>
                        {editingAdmin === admin._id ? (
                          <div className="edit-inline">
                            <input
                              type="text"
                              value={editData.firstName}
                              onChange={(e) =>
                                setEditData({ ...editData, firstName: e.target.value })
                              }
                              placeholder="First"
                              size="8"
                            />
                            <input
                              type="text"
                              value={editData.lastName}
                              onChange={(e) =>
                                setEditData({ ...editData, lastName: e.target.value })
                              }
                              placeholder="Last"
                              size="8"
                            />
                          </div>
                        ) : (
                          `${admin.firstName} ${admin.lastName}`
                        )}
                      </td>
                      <td>
                        {editingAdmin === admin._id ? (
                          <select
                            value={editData.adminRole}
                            onChange={(e) =>
                              setEditData({ ...editData, adminRole: e.target.value })
                            }
                          >
                            <option value="moderator">Moderator</option>
                            <option value="support">Support</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">SuperAdmin</option>
                          </select>
                        ) : (
                          <span className={`role-badge role-${admin.adminRole}`}>
                            {admin.adminRole}
                          </span>
                        )}
                      </td>
                      <td>
                        {admin.isSuperAdmin ? (
                          <span className="type-badge superadmin">🔑 SuperAdmin</span>
                        ) : (
                          <span className="type-badge admin">👤 Admin</span>
                        )}
                      </td>
                      <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                      <td className="actions-cell">
                        {editingAdmin === admin._id ? (
                          <>
                            <button
                              className="btn-small btn-success"
                              onClick={() => handleUpdateAdmin(admin._id)}
                            >
                              ✅ Save
                            </button>
                            <button
                              className="btn-small btn-secondary"
                              onClick={() => setEditingAdmin(null)}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-small btn-edit"
                              onClick={() => startEdit(admin)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-small btn-password"
                              onClick={() =>
                                setPasswordChange({ adminId: admin._id, newPassword: '' })
                              }
                            >
                              🔐 Password
                            </button>
                            {admin.isSuperAdmin && user?.isSuperAdmin ? (
                              <button
                                className="btn-small btn-danger"
                                onClick={() => handleDeleteAdmin(admin._id)}
                                title="Delete this SuperAdmin"
                              >
                                🗑️ Delete
                              </button>
                            ) : admin.isSuperAdmin ? (
                              <button
                                className="btn-small btn-danger"
                                disabled
                                title="Only SuperAdmin can delete SuperAdmin accounts"
                              >
                                🗑️ Cannot Delete
                              </button>
                            ) : (
                              <button
                                className="btn-small btn-danger"
                                onClick={() => handleDeleteAdmin(admin._id)}
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-small"
              >
                ← Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="btn-small"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Change Password Modal */}
      {passwordChange.adminId && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>🔐 Change Admin Password</h2>
            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                required
                minLength="8"
                value={passwordChange.newPassword}
                onChange={(e) =>
                  setPasswordChange({
                    ...passwordChange,
                    newPassword: e.target.value,
                  })
                }
                placeholder="At least 8 characters"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-success"
                onClick={handleChangePassword}
              >
                ✅ Update Password
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setPasswordChange({ adminId: null, newPassword: '' })}
              >
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
