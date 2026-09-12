import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Header.css';
import { useAuth } from '../hooks/useAuth';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';
import MobileNav from './MobileNav';
import ProfileDropdown from './ProfileDropdown';
import ToastContainer from './ToastContainer';
import { initSocket, setNotificationHandler, closeSocket } from '../utils/socket';
import { showToast } from '../utils/toastManager';
import { BarChart3, CalendarDays, Menu, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import '../styles/CartLink.css';

export default function Header() {
  const { t } = useTranslation('common');
  const { user, isAuthenticated, logout, token, activeRole } = useAuth();
  const { isAdmin: isAdminPerm, adminRole } = useAdminPermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = useCartStore((state) => state.lines.length);
  const cartPulse = useCartStore((state) => state.pulse);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const resizeTimeoutRef = useRef(null);
  const isCompactLayout = windowWidth < 768;
  const isAdminSession = Boolean(user?.isAdmin || user?.adminRole || isAdminPerm);
  const isAuthPage = ['/login', '/signup', '/register', '/verify-email'].includes(location.pathname);

  const currentRole = isAdminPerm ? 'admin' : activeRole || 'student';
  const showHostLinks = Boolean(user?.isHost && currentRole === 'host' && !isAdminPerm);
  const showStudentLinks = Boolean(!isAdminPerm && (currentRole === 'student' || !user?.isHost) && !(user?.isAdmin || user?.adminRole));
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

  if (isAuthPage || location.pathname.startsWith('/admin')) return null;

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          <span>EduTalk</span>
        </Link>

        {!isCompactLayout && (
          <nav className="nav">
            <div className="nav-primary">
              <NavLink to="/browse" className="nav-link">{t('header.browseClasses')}</NavLink>

              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard" className="nav-link">
                    {showHostLinks ? 'My Teaching' : t('header.dashboard')}
                  </NavLink>
                  {showHostLinks && !showFinancialControlOnly && (
                    <>
                      <NavLink to="/analytics" className="nav-link"><BarChart3 size={17} /> Analytics</NavLink>
                      <NavLink to="/schedules" className="nav-link"><CalendarDays size={17} /> Schedules</NavLink>
                    </>
                  )}
                  {showStudentLinks && !showFinancialControlOnly && (
                    <>
                      <NavLink to="/achievements" className="nav-link">Achievements</NavLink>
                      <NavLink to="/points" className="nav-link">Points</NavLink>
                      <NavLink to="/recordings" className="nav-link">Recordings</NavLink>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="nav-actions">
            {isAuthenticated ? (
              <>
                <NavLink to="/cart" className={`nav-link nav-action-link cart-link ${cartPulse ? 'cart-link--pulse' : ''}`} aria-label={`Cart with ${cartCount} items`}>
                  <ShoppingCart size={18} /> Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </NavLink>
                <NotificationBadge />
                <ProfileDropdown />
              </>
            ) : (
              <>
                <div className="auth-buttons">
                  <Link to="/login" className="nav-link">{t('header.login')}</Link>
                  <Link to="/signup" className="nav-button">{t('header.signup')}</Link>
                </div>
              </>
            )}
            </div>
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
              <Menu size={22} aria-hidden="true" />
            </button>

            {isAuthenticated && <ProfileDropdown />}

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
