import React, { useState } from 'react';

const HostDetailsModal = ({ host, onClose, onApprove, onReject, onSuspend, onUnsuspend }) => {
  const [activeTab, setActiveTab] = useState('profile');

  if (!host) return null;

  const hostStatus = host.status?.toUpperCase() || 'UNKNOWN';
  const statusColor = {
    APPROVED: '#22c55e',
    PENDING: '#f59e0b',
    SUSPENDED: '#ef4444',
    REJECTED: '#6b7280'
  }[hostStatus] || '#3b82f6';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <style>{`
        .host-details-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 900px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .host-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .host-modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .host-modal-header .status-badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .host-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: white;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .host-modal-close:hover {
          transform: scale(1.1);
        }

        .host-modal-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .host-modal-tab {
          padding: 16px 20px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          flex: 1;
          text-align: center;
        }

        .host-modal-tab:hover {
          color: #1a1a1a;
        }

        .host-modal-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .host-modal-content {
          padding: 24px;
        }

        .profile-section {
          display: grid;
          gap: 20px;
        }

        .profile-card {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .profile-card h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
          padding-bottom: 10px;
          border-bottom: 2px solid #e5e7eb;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .profile-item {
          display: flex;
          flex-direction: column;
        }

        .profile-item label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 5px;
        }

        .profile-item value {
          font-size: 14px;
          color: #1a1a1a;
          font-weight: 500;
        }

        .performance-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }

        .metric-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }

        .metric-card.classes {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .metric-card.students {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .metric-card.revenue {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .metric-label {
          font-size: 12px;
          opacity: 0.9;
          margin-bottom: 10px;
        }

        .metric-value {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }

        .classes-list {
          display: grid;
          gap: 10px;
        }

        .class-item {
          background: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }

        .class-item h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .class-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 10px;
          font-size: 12px;
          color: #666;
        }

        .activity-feed {
          display: grid;
          gap: 15px;
        }

        .activity-item {
          display: flex;
          gap: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-icon {
          min-width: 40px;
          width: 40px;
          height: 40px;
          background: #f9fafb;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .activity-content {
          flex: 1;
        }

        .activity-title {
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 5px 0;
        }

        .activity-time {
          font-size: 12px;
          color: #666;
          margin: 0;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          justify-content: flex-end;
        }

        .action-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .action-button.primary {
          background: #3b82f6;
          color: white;
        }

        .action-button.primary:hover {
          background: #2563eb;
        }

        .action-button.danger {
          background: #ef4444;
          color: white;
        }

        .action-button.danger:hover {
          background: #dc2626;
        }

        .action-button.secondary {
          background: white;
          color: #666;
          border: 1px solid #ddd;
        }

        .action-button.secondary:hover {
          background: #f9fafb;
        }

        .suspension-history {
          display: grid;
          gap: 10px;
        }

        .suspension-item {
          background: #fee2e2;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #dc2626;
        }

        .suspension-item h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #991b1b;
        }

        .suspension-item p {
          margin: 0;
          font-size: 13px;
          color: #7f1d1d;
        }
      `}</style>

      <div className="host-details-modal">
        {/* Header */}
        <div className="host-modal-header">
          <div>
            <h2>{host.hostName || host.name}</h2>
            <span className="status-badge" style={{ background: statusColor, color: 'white' }}>
              {hostStatus}
            </span>
          </div>
          <button className="host-modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="host-modal-tabs">
          <button
            className={`host-modal-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button
            className={`host-modal-tab ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            📊 Performance
          </button>
          <button
            className={`host-modal-tab ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            📚 Classes
          </button>
          <button
            className={`host-modal-tab ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            👥 Students
          </button>
          <button
            className={`host-modal-tab ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            📈 Activity
          </button>
        </div>

        {/* Content */}
        <div className="host-modal-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-card">
                <h3>Basic Information</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Host Name</label>
                    <value>{host.hostName || host.name || 'N/A'}</value>
                  </div>
                  <div className="profile-item">
                    <label>Email</label>
                    <value>{host.email || 'N/A'}</value>
                  </div>
                  <div className="profile-item">
                    <label>Plan Tier</label>
                    <value>{host.planTier || 'Starter'}</value>
                  </div>
                  <div className="profile-item">
                    <label>Status</label>
                    <value style={{ color: statusColor }}>{hostStatus}</value>
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <h3>Contact Details</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Phone</label>
                    <value>{host.phone || 'N/A'}</value>
                  </div>
                  <div className="profile-item">
                    <label>Location</label>
                    <value>{host.location || 'N/A'}</value>
                  </div>
                  <div className="profile-item">
                    <label>Bio</label>
                    <value>{host.bio || 'N/A'}</value>
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <h3>Verification</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Email Verified</label>
                    <value>{host.emailVerified ? '✓ Yes' : '✕ No'}</value>
                  </div>
                  <div className="profile-item">
                    <label>ID Verified</label>
                    <value>{host.idVerified ? '✓ Yes' : '✕ No'}</value>
                  </div>
                  <div className="profile-item">
                    <label>Stripe Account</label>
                    <value>{host.stripeConnectId ? '✓ Connected' : '✕ Not Connected'}</value>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="profile-section">
              <div className="performance-metrics">
                <div className="metric-card">
                  <div className="metric-label">Average Rating</div>
                  <p className="metric-value">⭐ {(host.rating || 0).toFixed(1)}</p>
                </div>
                <div className="metric-card classes">
                  <div className="metric-label">Total Classes</div>
                  <p className="metric-value">{host.classCount || 0}</p>
                </div>
                <div className="metric-card students">
                  <div className="metric-label">Total Students</div>
                  <p className="metric-value">{host.studentCount || 0}</p>
                </div>
                <div className="metric-card revenue">
                  <div className="metric-label">Total Revenue</div>
                  <p className="metric-value">${(host.totalRevenue || 0).toFixed(0)}</p>
                </div>
              </div>

              <div className="profile-card">
                <h3>Performance Details</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Active Classes</label>
                    <value>{host.activeClasses || 0}</value>
                  </div>
                  <div className="profile-item">
                    <label>Completion Rate</label>
                    <value>{(host.completionRate || 0).toFixed(1)}%</value>
                  </div>
                  <div className="profile-item">
                    <label>Student Satisfaction</label>
                    <value>{(host.studentSatisfaction || 0).toFixed(1)}%</value>
                  </div>
                  <div className="profile-item">
                    <label>Response Time</label>
                    <value>{host.avgResponseTime || 'N/A'}</value>
                  </div>
                  <div className="profile-item">
                    <label>Suspensions</label>
                    <value style={{ color: host.suspensions > 0 ? '#ef4444' : '#22c55e' }}>
                      {host.suspensions || 0}
                    </value>
                  </div>
                  <div className="profile-item">
                    <label>Last Active</label>
                    <value>{host.lastActive ? new Date(host.lastActive).toLocaleDateString() : 'N/A'}</value>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="profile-section">
              <div className="profile-card">
                <h3>Top Classes ({(host.topClasses?.length || 0)})</h3>
                {host.topClasses && host.topClasses.length > 0 ? (
                  <div className="classes-list">
                    {host.topClasses.map(cls => (
                      <div key={cls._id} className="class-item">
                        <h4>{cls.title}</h4>
                        <div className="class-info">
                          <div>👥 {cls.studentCount || 0} students</div>
                          <div>⭐ {(cls.rating || 0).toFixed(1)} rating</div>
                          <div>💰 ${(cls.price || 0).toFixed(2)}</div>
                          <div>📊 {cls.reviews || 0} reviews</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', margin: 0 }}>No classes found</p>
                )}
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="profile-section">
              <div className="profile-card">
                <h3>Student Statistics</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Total Students</label>
                    <value>{host.studentCount || 0}</value>
                  </div>
                  <div className="profile-item">
                    <label>Active This Month</label>
                    <value>{host.activeStudentsMonth || 0}</value>
                  </div>
                  <div className="profile-item">
                    <label>Retention Rate</label>
                    <value>{(host.retentionRate || 0).toFixed(1)}%</value>
                  </div>
                  <div className="profile-item">
                    <label>Avg. Students/Class</label>
                    <value>{host.avgStudentsPerClass || 0}</value>
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <h3>Student Feedback</h3>
                <div className="profile-grid">
                  <div className="profile-item">
                    <label>Positive Reviews</label>
                    <value>{host.positiveReviews || 0}</value>
                  </div>
                  <div className="profile-item">
                    <label>Negative Reviews</label>
                    <value>{host.negativeReviews || 0}</value>
                  </div>
                  <div className="profile-item">
                    <label>Complaints</label>
                    <value>{host.complaints || 0}</value>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="profile-section">
              <div className="profile-card">
                <h3>Recent Activity</h3>
                {host.activity && host.activity.length > 0 ? (
                  <div className="activity-feed">
                    {host.activity.map((item, idx) => (
                      <div key={idx} className="activity-item">
                        <div className="activity-icon">{item.icon || '📝'}</div>
                        <div className="activity-content">
                          <p className="activity-title">{item.action || 'Activity'}</p>
                          <p className="activity-time">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#999', margin: 0 }}>No recent activity</p>
                )}
              </div>

              {host.suspensionHistory && host.suspensionHistory.length > 0 && (
                <div className="profile-card">
                  <h3>Suspension History</h3>
                  <div className="suspension-history">
                    {host.suspensionHistory.map((suspension, idx) => (
                      <div key={idx} className="suspension-item">
                        <h4>Suspension #{idx + 1}</h4>
                        <p>
                          <strong>Reason:</strong> {suspension.reason || 'N/A'}<br />
                          <strong>Duration:</strong> {suspension.duration || 'Permanent'}<br />
                          <strong>Date:</strong> {suspension.date ? new Date(suspension.date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button className="action-button secondary" onClick={onClose}>
            Close
          </button>
          {host.status === 'pending' && (
            <>
              <button className="action-button danger" onClick={onReject}>
                Reject
              </button>
              <button className="action-button primary" onClick={onApprove}>
                Approve
              </button>
            </>
          )}
          {host.status === 'approved' && (
            <button className="action-button danger" onClick={onSuspend}>
              Suspend
            </button>
          )}
          {host.status === 'suspended' && (
            <button className="action-button primary" onClick={onUnsuspend}>
              Unsuspend
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostDetailsModal;
