import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import '../styles/MobileNav.css';

const MobileNav = ({ onLogout, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, activeRole } = useAuth();
  const { isAdmin: isAdminPerm, adminRole } = useAdminPermissions();
  const location = useLocation();
  const showFinancialControlOnly = adminRole === 'finance_admin';
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAdminSession = Boolean(user?.isAdmin || user?.adminRole || isAdminPerm);
  const hideRegularNavigation = isAdminRoute || isAdminSession;

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const resizeTimeoutRef = useRef(null);

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

  const currentRole = isAdminPerm ? 'admin' : activeRole || 'student';
  const showHostLinks = Boolean(user?.isHost && currentRole === 'host' && !isAdminPerm);
  const showStudentLinks = Boolean(!isAdminPerm && (currentRole === 'student' || !user?.isHost) && !(user?.isAdmin || user?.adminRole));

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const isActive = (path) => location.pathname === path;

  if (hideRegularNavigation) {
    return (
      <>
        <button
          className="mobile-menu-button"
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {isOpen && <div className="mobile-menu-overlay" onClick={closeMenu}></div>}

        <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
          <div className="mobile-nav-header">
            <h2>Admin</h2>
            <button className="mobile-nav-close" onClick={closeMenu} aria-label="Close navigation menu">
              Close
            </button>
          </div>

          <div className="mobile-nav-content">
            <div className="mobile-nav-section">
              <div className="mobile-nav-user">
                <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'A'}</div>
                <div className="user-info">
                  <p className="user-email">{user?.email || 'Admin'}</p>
                  <p className="user-role">{adminRole ? adminRole.replace('_', ' ') : 'Administrator'}</p>
                </div>
              </div>
            </div>

            <div className="mobile-nav-section">
              <Link
                to="/admin/dashboard"
                className={`mobile-nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Admin Dashboard
              </Link>
              <button
                type="button"
                className="mobile-nav-link"
                onClick={() => {
                  closeMenu();
                  if (onLogout) onLogout();
                }}
                style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      <button
        className="mobile-menu-button"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {isOpen && <div className="mobile-menu-overlay" onClick={closeMenu}></div>}

      <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <h2>Menu</h2>
          <button
            className="mobile-nav-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            Close
          </button>
        </div>

        <div className="mobile-nav-content">
          {!isAuthenticated && (
            <div className="mobile-nav-section">
              <Link
                to="/browse"
                className={`mobile-nav-link ${isActive('/browse') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Browse Classes
              </Link>
              <Link
                to="/login"
                className={`mobile-nav-link ${isActive('/login') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Login
              </Link>
              <Link
                to="/signup"
                className={`mobile-nav-link ${isActive('/signup') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                Sign Up
              </Link>
            </div>
          )}

          {isAuthenticated && (
            <>
              <div className="mobile-nav-section">
                <div className="mobile-nav-user">
                  <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
                  <div className="user-info">
                    <p className="user-email">{user?.email}</p>
                    <p className="user-role">
                      {isAdminPerm ? 'Admin' : currentRole === 'host' ? 'Instructor' : 'Student'}
                    </p>
                  </div>
                </div>
              </div>

              {!showFinancialControlOnly && (
                <div className="mobile-nav-section">
                  <h3 className="mobile-nav-section-title">Learning</h3>
                  <Link
                    to="/browse"
                    className={`mobile-nav-link ${isActive('/browse') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    Browse Classes
                  </Link>
                  <Link
                    to="/dashboard"
                    className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    {showHostLinks ? 'Host Dashboard' : 'My Dashboard'}
                  </Link>
                  {showStudentLinks && (
                    <Link
                      to="/points"
                      className={`mobile-nav-link ${isActive('/points') ? 'active' : ''}`}
                      onClick={closeMenu}
                    >
                      My Points
                    </Link>
                  )}
                </div>
              )}

              {showHostLinks && !showFinancialControlOnly && (
                <div className="mobile-nav-section">
                  <h3 className="mobile-nav-section-title">Teaching</h3>
                </div>
              )}

              <div className="mobile-nav-section">
                <h3 className="mobile-nav-section-title">Account</h3>
                <Link
                  to="/notifications"
                  className={`mobile-nav-link ${isActive('/notifications') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  Notifications
                </Link>
                <button
                  type="button"
                  className="mobile-nav-link"
                  onClick={() => {
                    closeMenu();
                    if (onLogout) onLogout();
                  }}
                  style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent' }}
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
