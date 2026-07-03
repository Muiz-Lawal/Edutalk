import React, { useState, useRef } from 'react';
import api from '../utils/api';
import '../styles/TwoFAVerification.css';

export default function TwoFAVerification({ token, sessionId, email, onSuccess, onBack }) {
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [method, setMethod] = useState('totp'); // 'totp' or 'backup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post(
        '/security/2fa/verify',
        method === 'totp'
          ? { token, verificationCode }
          : { token, backupCode }
      );

      if (response.status === 200) {
        setSuccess('✅ 2FA verified successfully!');
        setTimeout(() => {
          // Get user info from response or re-fetch
          const user = JSON.parse(localStorage.getItem('tempUser') || '{}');
          onSuccess(token, user, sessionId);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="two-fa-container">
      <div className="two-fa-box">
        <div className="two-fa-header">
          <h1>🔐 Two-Factor Authentication</h1>
          <p>Enter your verification code to complete login</p>
        </div>

        {error && <div className="two-fa-error">{error}</div>}
        {success && <div className="two-fa-success">{success}</div>}

        <form onSubmit={handleVerify}>
          {/* Method Selection */}
          <div className="two-fa-method-selector">
            <button
              type="button"
              className={`method-btn ${method === 'totp' ? 'active' : ''}`}
              onClick={() => {
                setMethod('totp');
                setError('');
                setBackupCode('');
              }}
            >
              📱 Authenticator App
            </button>
            <button
              type="button"
              className={`method-btn ${method === 'backup' ? 'active' : ''}`}
              onClick={() => {
                setMethod('backup');
                setError('');
                setVerificationCode('');
              }}
            >
              🔑 Backup Code
            </button>
          </div>

          {/* TOTP Method */}
          {method === 'totp' && (
            <div className="two-fa-form-group">
              <label htmlFor="verificationCode">
                Enter 6-digit code from your authenticator app
              </label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                pattern="\d{6}"
                required={method === 'totp'}
                disabled={loading}
                className="code-input"
                autoFocus
              />
              <p className="hint">Enter the 6-digit code without spaces</p>
            </div>
          )}

          {/* Backup Code Method */}
          {method === 'backup' && (
            <div className="two-fa-form-group">
              <label htmlFor="backupCode">
                Enter one of your backup codes
              </label>
              <input
                type="text"
                id="backupCode"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX"
                required={method === 'backup'}
                disabled={loading}
                autoFocus
              />
              <p className="hint">Format: XXXX-XXXX-XXXX or continuous</p>
            </div>
          )}

          <button
            type="submit"
            className="two-fa-verify-btn"
            disabled={loading}
          >
            {loading ? '⏳ Verifying...' : '✓ Verify'}
          </button>
        </form>

        <div className="two-fa-footer">
          <button
            type="button"
            className="two-fa-back-btn"
            onClick={onBack}
            disabled={loading}
          >
            ← Back to Login
          </button>
          <p className="two-fa-info">
            🔒 2FA adds an extra layer of security to your admin account
          </p>
        </div>
      </div>
    </div>
  );
}
