import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ConfirmDialog from '../components/ConfirmDialog';
import MessageBanner from '../components/MessageBanner';
import '../styles/AdminSecuritySettings.css';

export default function AdminSecuritySettings() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loginHistory, setLoginHistory] = useState([]);
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState('overview'); // overview, 2fa, history
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [twoFAModal, setTwoFAModal] = useState(null); // null, 'enable', 'disable'
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.get('/security/settings');
      setTwoFAEnabled(response.data.twoFAEnabled);
      setBackupCodes(response.data.backupCodes || []);
    } catch (err) {
      setError('Failed to load security settings');
    }

    try {
      const historyResponse = await api.get('/security/login-history', { params: { limit: 10 } });
      setLoginHistory(historyResponse.data.logins);
    } catch (err) {
      console.error('Failed to load login history:', err);
    }

    setLoading(false);
  };

  const handleDisable2FA = () => {
    setConfirm({
      open: true,
      title: 'Disable Two-Factor Authentication',
      message: '⚠️ Disabling 2FA will reduce your account security. Are you sure?',
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await api.post('/security/2fa/disable');
          setTwoFAEnabled(false);
          setSuccess('✅ Two-Factor Authentication disabled');
          setTwoFAModal(null);
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to disable 2FA');
        }
      },
    });
  };

  const handleRegenerateCodes = () => {
    setConfirm({
      open: true,
      title: 'Regenerate Backup Codes',
      message: 'Generate new backup codes? Old codes will no longer work.',
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          const response = await api.post('/security/2fa/regenerate-backup-codes');
          setBackupCodes(response.data.backupCodes);
          setSuccess('✅ New backup codes generated');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to regenerate backup codes');
        }
      },
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const getLoginIcon = (method) => {
    const icons = {
      password: '🔐',
      '2fa': '🔐🔑',
      session_restored: '🔓',
    };
    return icons[method] || '•';
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('✓ Copied to clipboard');
    setTimeout(() => setSuccess(''), 2500);
  };

  if (loading) {
    return <div className="settings-loading">⏳ Loading security settings...</div>;
  }

  return (
    <div className="admin-security-settings">
      <div className="settings-header">
        <h1>🔐 Security Settings</h1>
        <p>Manage your admin account security preferences</p>
      </div>

      {error && (
        <MessageBanner
          type="error"
          title="Security error"
          message={error}
          onClose={() => setError('')}
        />
      )}
      {success && (
        <MessageBanner
          type="success"
          title="Success"
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* Tab Navigation */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${tab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`tab-btn ${tab === '2fa' ? 'active' : ''}`}
          onClick={() => setTab('2fa')}
        >
          🔐 Two-Factor Auth
        </button>
        <button
          className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
          onClick={() => setTab('history')}
        >
          📜 Login History
        </button>
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="settings-content">
          <div className="settings-card">
            <h2>Security Status</h2>
            <div className="status-grid">
              <div className="status-item">
                <div className="status-label">Two-Factor Authentication</div>
                <div className={`status-value ${twoFAEnabled ? 'enabled' : 'disabled'}`}>
                  {twoFAEnabled ? '✓ Enabled' : '✗ Disabled'}
                </div>
              </div>
              <div className="status-item">
                <div className="status-label">Password Expiration</div>
                <div className="status-value active">90 days</div>
              </div>
              <div className="status-item">
                <div className="status-label">Session Timeout</div>
                <div className="status-value active">30 minutes</div>
              </div>
              <div className="status-item">
                <div className="status-label">Login Lockout</div>
                <div className="status-value active">5 attempts</div>
              </div>
            </div>
          </div>

          <div className="settings-card">
            <h2>Security Recommendations</h2>
            <div className="recommendations">
              {!twoFAEnabled && (
                <div className="recommendation critical">
                  <span className="icon">⚠️</span>
                  <div className="recommendation-content">
                    <h4>Enable Two-Factor Authentication</h4>
                    <p>2FA adds an extra layer of security to your admin account.</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setTwoFAModal('enable')}
                    >
                      Enable 2FA
                    </button>
                  </div>
                </div>
              )}
              <div className="recommendation info">
                <span className="icon">💡</span>
                <div className="recommendation-content">
                  <h4>Review Your Login Activity</h4>
                  <p>Regularly check your login history for any suspicious activity.</p>
                </div>
              </div>
              <div className="recommendation info">
                <span className="icon">💡</span>
                <div className="recommendation-content">
                  <h4>Use a Strong, Unique Password</h4>
                  <p>Avoid reusing passwords across different services.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Tab */}
      {tab === '2fa' && (
        <div className="settings-content">
          <div className="settings-card">
            <h2>Two-Factor Authentication</h2>
            <div className="two-fa-status">
              <div className="status-indicator">
                <div className={`indicator ${twoFAEnabled ? 'active' : 'inactive'}`}></div>
                <span>{twoFAEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <p className="status-description">
                {twoFAEnabled
                  ? 'Your account is protected with two-factor authentication. You will need to enter a code from your authenticator app when logging in.'
                  : 'Enable 2FA to require a verification code when logging in.'}
              </p>
            </div>

            <div className="two-fa-actions">
              {twoFAEnabled ? (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                  >
                    🔑 {showBackupCodes ? 'Hide' : 'View'} Backup Codes
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={handleRegenerateCodes}
                  >
                    🔄 Regenerate Backup Codes
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => setTwoFAModal('disable')}
                  >
                    ✗ Disable 2FA
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setTwoFAModal('enable')}
                >
                  🔐 Enable 2FA
                </button>
              )}
            </div>

            {/* Backup Codes */}
            {showBackupCodes && backupCodes.length > 0 && (
              <div className="backup-codes-section">
                <h3>Backup Codes</h3>
                <p className="backup-note">
                  Keep these codes in a safe place. You can use each code once to login if you lose access to your authenticator app.
                </p>
                <div className="backup-codes-list">
                  {backupCodes.map((code, index) => (
                    <div key={index} className="backup-code-item">
                      <code>{code}</code>
                      <button
                        className="copy-btn-small"
                        onClick={() => copyToClipboard(code)}
                        title="Copy code"
                      >
                        📋
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const text = backupCodes.join('\n');
                    const element = document.createElement('a');
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                    element.setAttribute('download', 'backup-codes.txt');
                    element.style.display = 'none';
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                  }}
                >
                  💾 Download Codes
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login History Tab */}
      {tab === 'history' && (
        <div className="settings-content">
          <div className="settings-card">
            <h2>Login History</h2>
            <p className="history-info">Showing your last 10 login attempts</p>

            {loginHistory.length === 0 ? (
              <p className="no-data">No login history available</p>
            ) : (
              <div className="login-history-list">
                {loginHistory.map((login, index) => (
                  <div key={index} className={`login-item ${login.successful ? 'success' : 'failed'}`}>
                    <div className="login-icon">{getLoginIcon(login.method)}</div>
                    <div className="login-info">
                      <div className="login-method">
                        {login.successful ? '✓' : '✗'} {login.method.toUpperCase()}
                      </div>
                      <p>{login.browser} on {login.os}</p>
                      <p className="ip">🌐 {login.ipAddress}</p>
                      <p className="timestamp">📅 {formatDate(login.loginTime)}</p>
                    </div>
                    {login.notes && (
                      <div className="login-notes">
                        {login.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {twoFAModal && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2>
                {twoFAModal === 'enable' ? '🔐 Enable Two-Factor Authentication' : '⚠️ Disable 2FA?'}
              </h2>
              <button
                className="modal-close"
                onClick={() => setTwoFAModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {twoFAModal === 'enable' && (
                <div>
                  <p>To enable 2FA, you will need to:</p>
                  <ol>
                    <li>Download an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.)</li>
                    <li>Scan a QR code with your app</li>
                    <li>Verify your setup with a test code</li>
                    <li>Save your backup codes in a safe place</li>
                  </ol>
                </div>
              )}

              {twoFAModal === 'disable' && (
                <div>
                  <p className="warning">
                    ⚠️ Disabling 2FA will reduce the security of your admin account. We strongly recommend keeping it enabled.
                  </p>
                  <p>Are you sure you want to disable two-factor authentication?</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setTwoFAModal(null)}
              >
                Cancel
              </button>
              {twoFAModal === 'enable' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    window.location.href = '/admin/security/2fa-setup';
                  }}
                >
                  Continue →
                </button>
              )}
              {twoFAModal === 'disable' && (
                <button
                  className="btn btn-danger"
                  onClick={handleDisable2FA}
                >
                  Disable 2FA
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
