import React, { useState } from 'react';
import api from '../utils/api';
import '../styles/ChangePassword.css';

export default function ChangePassword({ isExpired = false, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showCriteria, setShowCriteria] = useState(false);

  // Password strength validator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/\d/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;
    return Math.min(strength, 100);
  };

  const checkPasswordRequirements = (password) => {
    const requirements = {
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
    return requirements;
  };

  const handleNewPasswordChange = (e) => {
    const password = e.target.value;
    setNewPassword(password);
    const strength = calculatePasswordStrength(password);
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!isExpired && !currentPassword) {
      setError('Current password is required');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordStrength < 50) {
      setError('Password is too weak. Please use a stronger password.');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/security/password/change', {
        currentPassword: isExpired ? undefined : currentPassword,
        newPassword,
      });

      setSuccess('✅ Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        // Clear temporary token
        localStorage.removeItem('tempToken');
        
        if (isExpired) {
          // Redirect back to login for fresh authentication
          window.location.href = '/admin/login';
        } else if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const requirements = checkPasswordRequirements(newPassword);
  const allRequirementsMet = Object.values(requirements).every(v => v);

  return (
    <div className={`change-password-container ${isExpired ? 'expired' : ''}`}>
      <div className="change-password-box">
        <div className="password-header">
          <h1>{isExpired ? '🔄 Password Expired' : '🔐 Change Password'}</h1>
          <p>
            {isExpired
              ? 'Your admin password has expired. Please set a new one.'
              : 'Update your admin account password'}
          </p>
        </div>

        {error && <div className="password-error">{error}</div>}
        {success && <div className="password-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {/* Current Password */}
          {!isExpired && (
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* New Password */}
          <div className="form-group">
            <label htmlFor="newPassword">
              New Password
              {newPassword && (
                <span className="password-strength">
                  Strength: <span style={{ color: getStrengthColor(passwordStrength) }}>
                    {getStrengthText(passwordStrength)}
                  </span>
                </span>
              )}
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={handleNewPasswordChange}
              onFocus={() => setShowCriteria(true)}
              onBlur={() => setShowCriteria(false)}
              placeholder="Enter new password"
              disabled={loading}
              required
            />

            {/* Password Strength Bar */}
            {newPassword && (
              <div className="password-strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${passwordStrength}%`,
                    backgroundColor: getStrengthColor(passwordStrength),
                  }}
                ></div>
              </div>
            )}

            {/* Password Requirements */}
            {showCriteria && newPassword && (
              <div className="password-criteria">
                <p className={requirements.minLength ? 'met' : 'unmet'}>
                  ✓ At least 8 characters
                </p>
                <p className={requirements.uppercase ? 'met' : 'unmet'}>
                  ✓ Uppercase letter (A-Z)
                </p>
                <p className={requirements.lowercase ? 'met' : 'unmet'}>
                  ✓ Lowercase letter (a-z)
                </p>
                <p className={requirements.number ? 'met' : 'unmet'}>
                  ✓ Number (0-9)
                </p>
                <p className={requirements.special ? 'met' : 'unmet'}>
                  ✓ Special character (!@#$%^&*...)
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading}
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="mismatch-error">❌ Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            className="change-password-btn"
            disabled={loading || !allRequirementsMet}
          >
            {loading ? '⏳ Changing password...' : '✓ Change Password'}
          </button>
        </form>

        {isExpired && (
          <div className="expiration-notice">
            <p>
              ⚠️ For security reasons, admin passwords expire every 90 days.
              Please change your password to continue using the admin dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getStrengthColor(strength) {
  if (strength < 30) return '#f44336';
  if (strength < 60) return '#ff9800';
  if (strength < 85) return '#ffc107';
  return '#4caf50';
}

function getStrengthText(strength) {
  if (strength < 30) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 85) return 'Good';
  return 'Strong';
}
