import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/admin.css';

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-logo">
          <h2>EduTalk Admin</h2>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}>
            <span className="icon">📊</span>
            <span className="label">Dashboard</span>
          </Link>

          <Link to="/admin/users" className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
            <span className="icon">👥</span>
            <span className="label">Users</span>
          </Link>

          <Link to="/admin/moderation" className={`nav-item ${isActive('/admin/moderation') ? 'active' : ''}`}>
            <span className="icon">🛡️</span>
            <span className="label">Moderation</span>
          </Link>

          <Link to="/admin/payments" className={`nav-item ${isActive('/admin/payments') ? 'active' : ''}`}>
            <span className="icon">💰</span>
            <span className="label">Payments</span>
          </Link>

          <Link to="/admin/hosts" className={`nav-item ${isActive('/admin/hosts') ? 'active' : ''}`}>
            <span className="icon">🎓</span>
            <span className="label">Hosts</span>
          </Link>

          <Link to="/admin/analytics" className={`nav-item ${isActive('/admin/analytics') ? 'active' : ''}`}>
            <span className="icon">📈</span>
            <span className="label">Analytics</span>
          </Link>

          <Link to="/admin/logs" className={`nav-item ${isActive('/admin/logs') ? 'active' : ''}`}>
            <span className="icon">📋</span>
            <span className="label">Audit Logs</span>
          </Link>

          <Link to="/admin/settings" className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}>
            <span className="icon">⚙️</span>
            <span className="label">Settings</span>
          </Link>
        </nav>

        <div className="admin-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <div className="admin-header">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-title">
            {/* Title will be set by child pages */}
          </div>
        </div>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
};
