import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

export const UserDetailsModal = ({ user, isOpen, onClose, onAction }) => {
  const { fetchUserActivity } = useAdmin();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    if (isOpen && user) {
      loadActivity();
    }
  }, [isOpen, user]);

  const loadActivity = async () => {
    setLoading(true);
    const data = await fetchUserActivity(user._id);
    if (data) {
      setActivity(data.activity);
    }
    setLoading(false);
  };

  if (!isOpen || !user) return null;

  const getStatusBadge = (status) => {
    if (user.bannedAt) return { text: 'Banned', class: 'banned' };
    if (user.suspendedAt) return { text: 'Suspended', class: 'suspended' };
    return { text: 'Active', class: 'active' };
  };

  const statusInfo = getStatusBadge();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user.firstName} {user.lastName}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity
          </button>
          <button
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payments
          </button>
        </div>

        <div className="modal-body">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="info-row">
                <label>Email:</label>
                <span>{user.email}</span>
              </div>
              <div className="info-row">
                <label>Name:</label>
                <span>{user.firstName} {user.lastName}</span>
              </div>
              <div className="info-row">
                <label>Status:</label>
                <span className={`status-badge ${statusInfo.class}`}>
                  {statusInfo.text}
                </span>
              </div>
              <div className="info-row">
                <label>Role:</label>
                <span>
                  {user.isAdmin ? '👤 Admin' : ''}
                  {user.isHost ? '🎓 Host' : ''}
                  {user.isStudent ? '👨‍🎓 Student' : ''}
                  {!user.isAdmin && !user.isHost && !user.isStudent ? 'User' : ''}
                </span>
              </div>
              <div className="info-row">
                <label>Joined:</label>
                <span>{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              {user.suspendedAt && (
                <div className="info-row warning">
                  <label>Suspended:</label>
                  <span>{new Date(user.suspendedAt).toLocaleDateString()}</span>
                </div>
              )}
              {user.bannedAt && (
                <div className="info-row danger">
                  <label>Banned:</label>
                  <span>{new Date(user.bannedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="activity-section">
              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Loading activity...</p>
              ) : activity ? (
                <>
                  {/* Logins */}
                  <div className="activity-group">
                    <h4>Recent Logins</h4>
                    {activity.logins && activity.logins.length > 0 ? (
                      <ul className="activity-list">
                        {activity.logins.map((login, idx) => (
                          <li key={idx}>
                            <span className="time">{new Date(login.createdAt).toLocaleDateString()}</span>
                            <span className="action">{login.action === 'user_login' ? 'Logged in' : 'Account created'}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-data">No login history</p>
                    )}
                  </div>

                  {/* Enrollments */}
                  <div className="activity-group">
                    <h4>Enrollments</h4>
                    {activity.enrollments && activity.enrollments.length > 0 ? (
                      <ul className="activity-list">
                        {activity.enrollments.map((enroll, idx) => (
                          <li key={idx}>
                            <span className="time">{new Date(enroll.enrolledAt).toLocaleDateString()}</span>
                            <span className="action">Enrolled in {enroll.classTitle}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-data">No enrollments</p>
                    )}
                  </div>

                  {/* Hosted Classes */}
                  {user.isHost && activity.hostedClasses && activity.hostedClasses.length > 0 && (
                    <div className="activity-group">
                      <h4>Hosted Classes</h4>
                      <ul className="activity-list">
                        {activity.hostedClasses.map((cls, idx) => (
                          <li key={idx}>
                            <span className="action">{cls.title}</span>
                            <span className="time">{cls.totalStudents} students</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Admin Actions */}
                  {activity.adminActions && activity.adminActions.length > 0 && (
                    <div className="activity-group">
                      <h4>Admin Actions</h4>
                      <ul className="activity-list">
                        {activity.adminActions.map((action, idx) => (
                          <li key={idx}>
                            <span className="time">{new Date(action.createdAt).toLocaleDateString()}</span>
                            <span className="action">
                              {action.action.replace(/_/g, ' ')} by {action.adminEmail}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="no-data">No activity data available</p>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="payments-section">
              {loading ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Loading payments...</p>
              ) : activity && activity.payments && activity.payments.length > 0 ? (
                <div className="payments-list">
                  {activity.payments.map((payment, idx) => (
                    <div key={idx} className="payment-item">
                      <div className="payment-amount">${(payment.amount || 0).toFixed(2)}</div>
                      <div className="payment-details">
                        <span className="payment-type">{payment.type}</span>
                        <span className="payment-status">{payment.status}</span>
                      </div>
                      <div className="payment-date">{new Date(payment.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No payment history</p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {!user.suspendedAt && !user.bannedAt && (
            <button
              className="btn btn-warning"
              onClick={() => onAction('suspend', user)}
            >
              Suspend User
            </button>
          )}
          {user.suspendedAt && (
            <button
              className="btn btn-success"
              onClick={() => onAction('unsuspend', user)}
            >
              Unsuspend User
            </button>
          )}
          <button
            className="btn btn-info"
            onClick={() => onAction('message', user)}
          >
            Send Message
          </button>
          {!user.bannedAt && (
            <button
              className="btn btn-danger"
              onClick={() => onAction('delete', user)}
            >
              Delete User
            </button>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-dialog {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
        }

        .modal-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
          padding: 0 20px;
        }

        .tab-btn {
          flex: 1;
          padding: 15px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 14px;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab-btn.active {
          color: #2196F3;
          border-bottom-color: #2196F3;
        }

        .modal-body {
          padding: 20px;
        }

        .profile-section .info-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .profile-section .info-row label {
          font-weight: 600;
          color: #333;
          min-width: 100px;
        }

        .profile-section .info-row span {
          color: #666;
        }

        .profile-section .info-row.warning {
          background: #fff3cd;
        }

        .profile-section .info-row.danger {
          background: #f8d7da;
        }

        .activity-group {
          margin-bottom: 25px;
        }

        .activity-group h4 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .activity-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .activity-list li {
          display: flex;
          justify-content: space-between;
          padding: 10px;
          border-left: 3px solid #2196F3;
          background: #f5f5f5;
          margin-bottom: 8px;
          border-radius: 4px;
        }

        .activity-list .time {
          font-size: 12px;
          color: #999;
        }

        .activity-list .action {
          flex: 1;
          margin-left: 10px;
          color: #333;
        }

        .payments-list {
          display: grid;
          gap: 10px;
        }

        .payment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #eee;
          border-radius: 4px;
          background: #f9f9f9;
        }

        .payment-amount {
          font-weight: bold;
          font-size: 18px;
          color: #4CAF50;
          min-width: 80px;
        }

        .payment-details {
          flex: 1;
          margin: 0 15px;
        }

        .payment-type {
          display: block;
          color: #333;
          font-size: 14px;
        }

        .payment-status {
          display: block;
          color: #999;
          font-size: 12px;
          margin-top: 5px;
        }

        .payment-date {
          color: #999;
          font-size: 12px;
          white-space: nowrap;
        }

        .no-data {
          text-align: center;
          color: #999;
          padding: 20px;
          font-style: italic;
        }

        .modal-footer {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .btn {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        .btn-warning {
          background: #FF9800;
          color: white;
        }

        .btn-warning:hover {
          background: #e68900;
        }

        .btn-success {
          background: #4CAF50;
          color: white;
        }

        .btn-success:hover {
          background: #45a049;
        }

        .btn-info {
          background: #2196F3;
          color: white;
        }

        .btn-info:hover {
          background: #0b7dda;
        }

        .btn-danger {
          background: #f44336;
          color: white;
        }

        .btn-danger:hover {
          background: #da190b;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.suspended {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.banned {
          background: #f8d7da;
          color: #721c24;
        }
      `}</style>
    </div>
  );
};

export default UserDetailsModal;
