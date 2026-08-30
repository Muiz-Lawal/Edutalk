import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Header.css';
import { useAuth } from '../hooks/useAuth';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';
import MobileNav from './MobileNav';
import LanguageSwitcher from './LanguageSwitcher';
import ToastContainer from './ToastContainer';
import { initSocket, setNotificationHandler, closeSocket } from '../utils/socket';
import { showToast } from '../utils/toastManager';
import api from '../utils/api';

export default function Header() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, logout, token, activeRole, setActiveRole } = useAuth();
  const { isAdmin: isAdminPerm, adminRole } = useAdminPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pointsBalance, setPointsBalance] = useState(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const resizeTimeoutRef = useRef(null);
  const isCompactLayout = windowWidth < 768;
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminSession = Boolean(user?.isAdmin);
  const hideRegularNavigation = isAdminRoute || isAdminSession;

  const currentRole = isAdminPerm ? 'admin' : activeRole || 'student';
  const canSwitchRole = Boolean(user?.isHost && !isAdminPerm);
  const showFinancialControlOnly = adminRole === 'finance_admin';

  const handleLogout = () => {
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
      if (!user || user.isAdmin) return;
      try {
        const res = await api.get(`/points/balance/${user._id}`);
        if (mounted) setPointsBalance(res.data.balance || 0);
      } catch (err) {
        console.warn('Failed to load points balance', err.message || err);
      }
    }

    fetchBalance();

    if (isAuthenticated && token) {
      initSocket(token);
      setNotificationHandler((notif) => {
        if (notif && notif.type === 'achievement_unlocked') {
          showToast({
            title: notif.title || 'Achievement Unlocked',
            message: notif.message || '',
            type: 'success',
            ttl: 6000,
            action: { url: '/achievements', label: 'View' },
          });
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user, token]);

  useEffect(() => {
    const onResize = () => {
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
      resizeTimeoutRef.current = setTimeout(() => {
        setWindowWidth(window.innerWidth);
        resizeTimeoutRef.current = null;
      }, 150);
    };

    window.addEventListener('resize', onResize);
    setWindowWidth(window.innerWidth);

    return () => {
      window.removeEventListener('resize', onResize);
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
    };
  }, []);

  if (hideRegularNavigation) {
    return (
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            <h1>EduTalk</h1>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
            {isAdminRoute && (
              <span style={{
                padding: '6px 10px',
                borderRadius: '999px',
                background: '#111827',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                {adminRole ? adminRole.replace('_', ' ') : 'Admin'}
              </span>
            )}
            <button onClick={handleLogout} className="nav-button logout">
              {t('header.logout')}
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <h1>EduTalk</h1>
        </Link>

        {!isCompactLayout && (
          <nav className="nav">
            <Link to="/browse" className="nav-link">{t('header.browseClasses')}</Link>

            {isAuthenticated ? (
              <>
                {canSwitchRole && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 8px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveRole('student')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        border: '1px solid #d1d5db',
                        background: currentRole === 'student' ? '#1d4ed8' : '#fff',
                        color: currentRole === 'student' ? '#fff' : '#111827',
                        cursor: 'pointer',
                      }}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveRole('host')}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        border: '1px solid #d1d5db',
                        background: currentRole === 'host' ? '#16a34a' : '#fff',
                        color: currentRole === 'host' ? '#fff' : '#111827',
                        cursor: 'pointer',
                      }}
                    >
                      Host
                    </button>
                  </div>
                )}
                <Link to="/dashboard" className="nav-link">
                  {currentRole === 'host' ? 'My Teaching' : t('header.dashboard')}
                </Link>
                {currentRole === 'host' && user?.isHost && !showFinancialControlOnly && (
                  <>
                    <Link to="/host-dashboard" className="nav-link">Host Dashboard</Link>
                    <Link to="/analytics" className="nav-link">📊 Analytics</Link>
                    <Link to="/moderation" className="nav-link">🛡️ Moderation</Link>
                    <Link to="/schedules" className="nav-link">📅 Schedules</Link>
                  </>
                )}
                {currentRole === 'student' && !showFinancialControlOnly && (
                  <>
                    <Link to="/achievements" className="nav-link">Achievements</Link>
                    <Link to="/points" className="nav-link">Points</Link>
                  </>
                )}
                {currentRole === 'student' && !showFinancialControlOnly && (
                  <>
                    <Link to="/recordings" className="nav-link">Recordings</Link>
                    <Link to="/appeals" className="nav-link" title="View your content appeals">📋 Appeals</Link>
                  </>
                )}
                <NotificationBadge />
                <LanguageSwitcher />
                {!isAdminPerm && (
                  <div className="points-inline" title="Total points">
                    🏅 {pointsBalance != null ? pointsBalance : '—'}
                  </div>
                )}
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
        )}

        {isCompactLayout && (
          <>
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

            {mobileMenuOpen && (
              <MobileNav
                isAuthenticated={isAuthenticated}
                user={user}
                onLogout={handleLogout}
                onClose={closeMobileMenu}
              />
            )}
          </>
        )}
      </div>
      <ToastContainer />
    </header>
  );
}
