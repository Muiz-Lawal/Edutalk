import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import TwoFAVerification from '../components/TwoFAVerification';
import ChangePassword from '../components/ChangePassword';
import '../styles/AdminLoginPage.css';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [token, setToken] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/admin/login', { email, password });
      console.log('Login response:', response.data); // Debug log
      const { user, token: authToken, requires2FA: need2FA, sessionId: sId, requiresPasswordChange: needPasswordChange, message } = response.data;

      // Handle password expiration
      if (needPasswordChange) {
        console.log('Password change required'); // Debug log
        setToken(authToken);
        setRequiresPasswordChange(true);
        localStorage.setItem('tempToken', authToken);
        return;
      }

      // Handle 2FA requirement
      if (need2FA) {
        setToken(authToken);
        setSessionId(sId);
        setRequires2FA(true);
        setFailedAttempts(0);
        return;
      }

      // Normal login - check if user is admin
      if (!user.isAdmin) {
        setError('❌ Access denied. Admin account required.');
        setLoading(false);
        return;
      }

      // Save token and user
      localStorage.setItem('sessionId', sId);
      setAuthSession(user, authToken);

      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Login error:', err); // Debug log
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.';
      setError(`❌ ${errorMsg}`);
      
      // Check for account lock
      if (err.response?.status === 423) {
        setLoading(false);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA verification success
  const handleTwoFASuccess = (authToken, user, sId) => {
    localStorage.setItem('sessionId', sId);
    setAuthSession(user, authToken);
    navigate('/admin/dashboard');
  };

  // Handle password change
  const handlePasswordChangeNeeded = () => {
    navigate('/admin/change-password', { state: { tempToken: token } });
  };

  if (requires2FA) {
    return (
      <TwoFAVerification
        token={token}
        sessionId={sessionId}
        email={email}
        onSuccess={handleTwoFASuccess}
        onBack={() => {
          setRequires2FA(false);
          setToken('');
          setSessionId('');
          setEmail('');
          setPassword('');
        }}
      />
    );
  }

  if (requiresPasswordChange) {
    return (
      <ChangePassword
        isExpired={true}
        onSuccess={() => {
          // Reset password change flag and redirect to login
          setRequiresPasswordChange(false);
          setToken('');
          setEmail('');
          setPassword('');
        }}
      />
    );
  }

  return (
    <div className="admin-login-container">
      <div className="admin-login-box">
        <div className="admin-login-header">
          <h1>🔐 Admin Login</h1>
          <p>EduTalk Platform Administration</p>
        </div>

        {error && (
          <div className="admin-login-error">
            {error}
            {error.includes('locked') && (
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Please try again in 30 minutes.
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@edutalk.com"
              required
              disabled={loading}
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? '⏳ Logging in...' : '🔓 Login to Admin Panel'}
          </button>
        </form>

        <div className="admin-login-footer">
          <p className="admin-login-info">
            🔒 This login is protected by advanced security measures including rate limiting, 2FA, and activity monitoring.
          </p>
          <a href="/" className="admin-back-link">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
