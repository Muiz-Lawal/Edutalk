import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';
import MessageBanner from '../components/MessageBanner';
import '../styles/SecurityDashboard.css';

export default function SecurityDashboard() {
  const [activeSessions, setActiveSessions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [flaggedActivities, setFlaggedActivities] = useState([]);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview'); // overview, sessions, activity, flagged
  const [filterAction, setFilterAction] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    setError('');

    try {
      const [sessionsRes, activityRes, flaggedRes, trendsRes] = await Promise.all([
        api.get('/security/sessions'),
        api.get('/security/activity/logs', { params: { limit: 50 } }),
        api.get('/security/activity/flagged', { params: { limit: 20 } }),
        api.get('/security/activity/trends', { params: { days: 30 } }),
      ]);

      setActiveSessions(sessionsRes.data);
      setActivityLogs(activityRes.data.activities);
      setFlaggedActivities(flaggedRes.data.activities);
      setTrends(trendsRes.data);
    } catch (err) {
      setError('Failed to load security data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = (sessionId) => {
    setConfirm({
      open: true,
      title: 'Logout Session',
      message: 'Logout this session?',
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await api.post(`/security/sessions/${sessionId}/logout`);
          setActiveSessions(activeSessions.filter(s => s._id !== sessionId));
        } catch (err) {
          setError('Failed to logout session');
        }
      },
    });
  };

  const handleLogoutAll = () => {
    setConfirm({
      open: true,
      title: 'Logout All Sessions',
      message: 'Logout from all sessions? You will need to login again.',
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await api.post('/security/sessions/logout-all');
          setActiveSessions([]);
          setTimeout(() => {
            localStorage.removeItem('token');
            window.location.href = '/admin/login';
          }, 1000);
        } catch (err) {
          setError('Failed to logout all sessions');
        }
      },
    });
  };

  const handleExportLogs = async () => {
    try {
      const response = await api.get('/security/activity/export', {
        params: { format: 'csv' },
      });
      
      // Create blob and download
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(response.data));
      element.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setError('Failed to export logs');
      console.error(err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#9C27B0',
    };
    return colors[severity] || '#999';
  };

  const getActionIcon = (action) => {
    const icons = {
      login: 'ðŸ”“',
      logout: 'ðŸ”’',
      user_deleted: 'ðŸ—‘ï¸',
      admin_created: 'ðŸ‘¤',
      '2fa_enabled': 'ðŸ”',
      '2fa_disabled': 'ðŸ”‘',
      password_changed: 'ðŸ”‘',
      failed_login: 'âŒ',
      inactivity_logout: 'â°',
      session_logout: 'ðŸ”“',
    };
    return icons[action] || 'â€¢';
  };

  if (loading) {
    return (
      <div className="security-dashboard">
        <div className="loading">â³ Loading security dashboard...</div>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      <div className="security-header">
        <h1>ðŸ” Security Dashboard</h1>
        <p>Monitor your admin account security and activity</p>
      </div>

      {error && (
        <MessageBanner type="error" title="Security error" message={error} onClose={() => setError('')} />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* Tab Navigation */}
      <div className="security-tabs">
        <button
          className={`tab-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          ðŸ“Š Overview
        </button>
        <button
          className={`tab-btn ${tab === 'sessions' ? 'active' : ''}`}
          onClick={() => setTab('sessions')}
        >
          ðŸ“± Sessions ({activeSessions.length})
        </button>
        <button
          className={`tab-btn ${tab === 'activity' ? 'active' : ''}`}
          onClick={() => setTab('activity')}
        >
          ðŸ“‹ Activity Logs
        </button>
        <button
          className={`tab-btn ${tab === 'flagged' ? 'active' : ''}`}
          onClick={() => setTab('flagged')}
        >
          ðŸš© Flagged ({flaggedActivities.length})
        </button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="tab-content">
          <div className="overview-grid">
            <div className="overview-card">
              <div className="card-icon">ðŸ“±</div>
              <div className="card-info">
                <h3>Active Sessions</h3>
                <p className="card-value">{activeSessions.length}</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">ðŸ“</div>
              <div className="card-info">
                <h3>Activity Logs</h3>
                <p className="card-value">{activityLogs.length}</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">ðŸš©</div>
              <div className="card-info">
                <h3>Flagged Activities</h3>
                <p className="card-value">{flaggedActivities.length}</p>
              </div>
            </div>

            <div className="overview-card">
              <div className="card-icon">ðŸ“ˆ</div>
              <div className="card-info">
                <h3>30-Day Trends</h3>
                <p className="card-value">{trends.length} events</p>
              </div>
            </div>
          </div>

          {/* Activity Trends Chart */}
          <div className="trends-section">
            <h2>Activity Trends (Last 30 Days)</h2>
            <div className="trends-list">
              {trends.slice(0, 10).map((trend, index) => (
                <div key={index} className="trend-item">
                  <span className="trend-label">
                    {trend._id.date} - {trend._id.action}
                  </span>
                  <div className="trend-bar" style={{ width: `${Math.min(trend.count * 5, 100)}%` }}>
                    {trend.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {tab === 'sessions' && (
        <div className="tab-content">
          <div className="sessions-header">
            <h2>Active Sessions</h2>
            <button
              className="btn btn-danger"
              onClick={handleLogoutAll}
              disabled={activeSessions.length === 0}
            >
              ðŸšª Logout All Sessions
            </button>
          </div>

          {activeSessions.length === 0 ? (
            <p className="no-data">No active sessions</p>
          ) : (
            <div className="sessions-list">
              {activeSessions.map((session) => (
                <div key={session._id} className="session-card">
                  <div className="session-info">
                    <h3>{session.browserInfo.name} on {session.browserInfo.os}</h3>
                    <p>ðŸŒ {session.ipAddress}</p>
                    <p>ðŸ”“ Logged in: {formatDate(session.loginTime)}</p>
                    <p>â° Last activity: {formatDate(session.lastActivityTime)}</p>
                    {session.twoFAVerified && (
                      <p className="verified">âœ“ 2FA Verified</p>
                    )}
                  </div>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleLogoutSession(session._id)}
                  >
                    ðŸšª Logout
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Tab */}
      {tab === 'activity' && (
        <div className="tab-content">
          <div className="activity-header">
            <h2>Activity Logs</h2>
            <button className="btn btn-primary" onClick={handleExportLogs}>
              ðŸ’¾ Export as CSV
            </button>
          </div>

          <div className="activity-filters">
            <input aria-label="Filter by action..."
              type="text"
               placeholder="Filter by action..."
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="filter-input"
            />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="filter-select"
            >
              <option value="">All Severities</option>
              <option value="low">ðŸŸ¢ Low</option>
              <option value="medium">ðŸŸ¡ Medium</option>
              <option value="high">ðŸ”´ High</option>
              <option value="critical">âš« Critical</option>
            </select>
          </div>

          {activityLogs.length === 0 ? (
            <p className="no-data">No activity logs</p>
          ) : (
            <div className="activity-list">
              {activityLogs
                .filter(log => 
                  log.action.includes(filterAction) &&
                  (!filterSeverity || log.severity === filterSeverity)
                )
                .map((log, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">{getActionIcon(log.action)}</div>
                    <div className="activity-details">
                      <h4>{log.action}</h4>
                      <p>{log.description}</p>
                      <p className="meta">ðŸŒ {log.ipAddress} â€¢ {formatDate(log.createdAt)}</p>
                    </div>
                    <div
                      className="severity-badge"
                      style={{ backgroundColor: getSeverityColor(log.severity) }}
                    >
                      {log.severity}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Flagged Tab */}
      {tab === 'flagged' && (
        <div className="tab-content">
          <h2>ðŸš© Flagged Activities</h2>

          {flaggedActivities.length === 0 ? (
            <p className="no-data">No flagged activities</p>
          ) : (
            <div className="flagged-list">
              {flaggedActivities.map((activity, index) => (
                <div key={index} className="flagged-item">
                  <div className="flagged-header">
                    <h4>âš ï¸ {activity.action}</h4>
                    <span className="flag-reason">{activity.flagReason}</span>
                  </div>
                  <div className="flagged-body">
                    <p><strong>Description:</strong> {activity.description}</p>
                    <p><strong>IP Address:</strong> {activity.ipAddress}</p>
                    <p><strong>Timestamp:</strong> {formatDate(activity.createdAt)}</p>
                    <p><strong>Admin:</strong> {activity.adminEmail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

