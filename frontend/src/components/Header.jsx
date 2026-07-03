import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Header.css';
import { useAuth } from '../hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';
import MobileNav from './MobileNav';
import LanguageSwitcher from './LanguageSwitcher';
import ToastContainer from './ToastContainer';
import { initSocket, setNotificationHandler, closeSocket } from '../utils/socket';
import { showToast } from '../utils/toastManager';
import api from '../utils/api';

export default function Header() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, logout, token } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(null);

  const handleLogout = () => {
    // close socket on logout
    try { closeSocket(); } catch (e) {}
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    let mounted = true;
    async function fetchBalance() {
      if (!user) return;
      try {
        const res = await api.get(`/points/balance/${user._id}`);
        if (mounted) setPointsBalance(res.data.balance || 0);
      } catch (err) {
        console.warn('Failed to load points balance', err.message || err);
      }
    }

    fetchBalance();

    // init socket if token exists
    if (isAuthenticated && token) {
      const sock = initSocket(token);
      setNotificationHandler((notif) => {
        // show a toast on achievement notifications
        if (notif && notif.type === 'achievement_unlocked') {
          showToast({
            title: notif.title || 'Achievement Unlocked',
            message: notif.message || '',
            type: 'success',
            ttl: 6000,
        action: { url: '/achievements', label: 'View' }
      });
    }
      });
    }

    return () => { mounted = false; };
  }, [isAuthenticated, user, token]);

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>EduTalk</h1>
        </Link>

        <nav className="nav">
          <Link to="/browse" className="nav-link">{t('header.browseClasses')}</Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">
                {user?.isHost ? 'My Teaching' : t('header.dashboard')}
              </Link>
              {user?.isHost && (
                <>
                  <Link to="/host-dashboard" className="nav-link">Host Dashboard</Link>
                  <Link to="/analytics" className="nav-link">📊 Analytics</Link>
                  <Link to="/moderation" className="nav-link">🛡️ Moderation</Link>
                  <Link to="/schedules" className="nav-link">📅 Schedules</Link>
                </>
              )}
              <Link to="/achievements" className="nav-link">Achievements</Link>
              <Link to="/points" className="nav-link">Points</Link>
              {user?.isAdmin && (                <Link to="/admin/dashboard" className="nav-link admin-link">🔐 Admin Panel</Link>
              )}
              <Link to="/recordings" className="nav-link">Recordings</Link>
              <Link to="/appeals" className="nav-link" title="View your content appeals">📋 Appeals</Link>
              <NotificationBadge />
              <LanguageSwitcher />
              <div className="points-inline" title="Total points">
                🏅 {pointsBalance != null ? pointsBalance : '—'}
              </div>
              <button onClick={handleLogout} className="nav-button logout">
                {t('header.logout')}
              </button>
            </>
          ) : (
            <>
              <div className="auth-buttons">
                <Link to="/login" className="nav-link">{t('header.login')}</Link>
                <Link to="/signup" className="nav-button">{t('header.signup')}</Link>
              </div>
              <LanguageSwitcher />
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <MobileNav
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
            onClose={closeMobileMenu}
          />
        )}
      </div>
      <ToastContainer />
    </header>
  );
}
