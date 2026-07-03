import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/MobileNav.css';

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Button */}
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

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="mobile-menu-overlay" onClick={closeMenu}></div>
      )}

      {/* Mobile Menu */}
      <nav className={`mobile-nav ${isOpen ? 'open' : ''}`}>
        <div className="mobile-nav-header">
          <h2>Menu</h2>
          <button
            className="mobile-nav-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            ✕
          </button>
        </div>

        <div className="mobile-nav-content">
          {/* Guest Links */}
          {!isAuthenticated && (
            <div className="mobile-nav-section">
              <Link
                to="/browse"
                className={`mobile-nav-link ${isActive('/browse') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                📚 Browse Classes
              </Link>
              <Link
                to="/login"
                className={`mobile-nav-link ${isActive('/login') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                🔐 Login
              </Link>
              <Link
                to="/signup"
                className={`mobile-nav-link ${isActive('/signup') ? 'active' : ''}`}
                onClick={closeMenu}
              >
                ✏️ Sign Up
              </Link>
            </div>
          )}

          {/* Authenticated User Links */}
          {isAuthenticated && (
            <>
              <div className="mobile-nav-section">
                <div className="mobile-nav-user">
                  <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
                  <div className="user-info">
                    <p className="user-email">{user?.email}</p>
                    <p className="user-role">
                      {user?.isHost ? '👨‍🏫 Instructor' : '👤 Student'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mobile-nav-section">
                <h3 className="mobile-nav-section-title">Learning</h3>
                <Link
                  to="/browse"
                  className={`mobile-nav-link ${isActive('/browse') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  📚 Browse Classes
                </Link>
                <Link
                  to="/dashboard"
                  className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  📊 My Dashboard
                </Link>
                <Link
                  to="/progress"
                  className={`mobile-nav-link ${isActive('/progress') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  📈 My Progress
                </Link>
                <Link
                  to="/points"
                  className={`mobile-nav-link ${isActive('/points') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  🏅 My Points
                </Link>
              </div>

              {user?.isHost && (
                <div className="mobile-nav-section">
                  <h3 className="mobile-nav-section-title">Teaching</h3>
                  <Link
                    to="/host-dashboard"
                    className={`mobile-nav-link ${isActive('/host-dashboard') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    🎓 Host Dashboard
                  </Link>
                  <Link
                    to="/live-stream"
                    className={`mobile-nav-link ${isActive('/live-stream') ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    🔴 Go Live
                  </Link>
                </div>
              )}

              <div className="mobile-nav-section">
                <h3 className="mobile-nav-section-title">Account</h3>
                <Link
                  to="/profile"
                  className={`mobile-nav-link ${isActive('/profile') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  👤 Profile
                </Link>
                <Link
                  to="/settings"
                  className={`mobile-nav-link ${isActive('/settings') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  ⚙️ Settings
                </Link>
                <Link
                  to="/notifications"
                  className={`mobile-nav-link ${isActive('/notifications') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  🔔 Notifications
                </Link>
              </div>
            </>
          )}

          <div className="mobile-nav-section mobile-nav-footer">
            <a href="https://edutalk.com/help" className="mobile-nav-link">
              ❓ Help & Support
            </a>
            <a href="https://edutalk.com/privacy" className="mobile-nav-link">
              🔒 Privacy Policy
            </a>
          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
