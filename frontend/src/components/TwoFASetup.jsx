import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/TwoFASetup.css';

export default function TwoFASetup() {
  const [step, setStep] = useState(1); // 1: Generate, 2: Verify, 3: Backup Codes
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Step 1: Generate 2FA Secret
  const handleGenerate = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/security/2fa/generate');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/security/2fa/enable', {
        secret,
        verificationCode,
      });

      setBackupCodes(response.data.backupCodes);
      setSuccess('✅ 2FA enabled successfully!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="two-fa-setup-container">
      <div className="two-fa-setup-box">
        <div className="two-fa-setup-header">
          <h1>🔐 Enable Two-Factor Authentication</h1>
          <p>Protect your admin account with an extra layer of security</p>
        </div>

        {error && <div className="setup-error">{error}</div>}
        {success && <div className="setup-success">{success}</div>}

        {/* Step 1: Setup Authenticator App */}
        {step === 1 && (
          <div className="setup-step">
            <div className="step-number">Step 1 of 3</div>
            <h2>📱 Download Authenticator App</h2>
            <p>
              Download one of these authenticator apps on your phone:
            </p>
            <div className="app-links">
              <a href="https://apps.apple.com/app/google-authenticator/id388497605" target="_blank" rel="noopener noreferrer">
                🍎 Google Authenticator (iOS)
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank" rel="noopener noreferrer">
                🤖 Google Authenticator (Android)
              </a>
              <a href="https://apps.apple.com/app/microsoft-authenticator/id981333031" target="_blank" rel="noopener noreferrer">
                🔐 Microsoft Authenticator
              </a>
              <a href="https://authy.com" target="_blank" rel="noopener noreferrer">
                🔑 Authy
              </a>
            </div>

            <button
              className="setup-btn"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? '⏳ Generating...' : 'Next: Generate Secret'}
            </button>
          </div>
        )}

        {/* Step 2: Scan QR Code */}
        {step === 2 && (
          <div className="setup-step">
            <div className="step-number">Step 2 of 3</div>
            <h2>🔍 Scan QR Code</h2>
            <p>Scan this QR code with your authenticator app:</p>

            <div className="qr-container">
              {qrCode && (
                <img src={qrCode} alt="2FA QR Code" className="qr-code" />
              )}
            </div>

            <div className="manual-entry">
              <p>Can't scan? Enter this code manually:</p>
              <div className="secret-box">
                <code>{secret}</code>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copyToClipboard(secret)}
                >
                  {copied ? '✓ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Enter 6-digit code to verify:</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  pattern="\d{6}"
                  required
                  disabled={loading}
                  className="code-input"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="setup-btn"
                disabled={loading}
              >
                {loading ? '⏳ Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          </div>
        )}

        {/* Step 3: Backup Codes */}
        {step === 3 && (
          <div className="setup-step">
            <div className="step-number">Step 3 of 3</div>
            <h2>🔑 Save Backup Codes</h2>
            <p className="important-note">
              ⚠️ Save these backup codes in a safe place. Use them if you lose access to your authenticator app.
            </p>

            <div className="backup-codes-container">
              <div className="backup-codes-list">
                {backupCodes.map((code, index) => (
                  <div key={index} className="backup-code">
                    <span className="code-number">{index + 1}.</span>
                    <code>{code}</code>
                    <button
                      type="button"
                      className="copy-icon"
                      onClick={() => copyToClipboard(code)}
                      title="Copy code"
                    >
                      📋
                    </button>
                  </div>
                ))}
              </div>

              <div className="backup-actions">
                <button
                  type="button"
                  className="action-btn"
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
                <button
                  type="button"
                  className="action-btn"
                  onClick={() => copyToClipboard(backupCodes.join('\n'))}
                >
                  📋 Copy All Codes
                </button>
              </div>
            </div>

            <div className="completion-message">
              <h3>✅ 2FA Setup Complete!</h3>
              <p>Your account is now protected with two-factor authentication.</p>
            </div>

            <button
              type="button"
              className="setup-btn"
              onClick={() => window.location.href = '/admin/dashboard'}
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
