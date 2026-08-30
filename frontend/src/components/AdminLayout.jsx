import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import { useAuth } from '../context/AuthContext';
import { useAdminPermissions } from '../hooks/useAdminPermissions';

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('sessionId');
    localStorage.removeItem('tempToken');
    navigate('/admin/login');
  };

  const role = user?.adminRole || 'admin';
  const isFinanceAdmin = role === 'finance_admin';
  const isModerator = role === 'moderator';
  const isSupport = role === 'support';
  const isSuperAdmin = role === 'superadmin';
  const { hasPermission } = useAdminPermissions();

  const canModerate = (hasPermission('moderate_content') && !isFinanceAdmin) || isModerator || isSuperAdmin;
  const canViewPayments = hasPermission('view_payments') || isFinanceAdmin || isSuperAdmin;
  const canViewAudit = hasPermission('view_audit_logs') || isFinanceAdmin || isSuperAdmin;
  const canManageSettings = hasPermission('manage_admins') && isSuperAdmin;
  const canManageUsers = role === 'admin' || role === 'support' || role === 'moderator' || isSuperAdmin;
  const canViewHosts = role === 'admin' || isSuperAdmin;
  const canViewAnalytics = role === 'admin' || isSuperAdmin;

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: '📊', show: true },
    { to: '/admin/users', label: 'Users', icon: '👥', show: canManageUsers },
    { to: '/admin/moderation', label: 'Moderation', icon: '🛡️', show: canModerate },
    { to: '/admin/payments', label: 'Payments', icon: '💰', show: canViewPayments },
    { to: '/admin/hosts', label: 'Hosts', icon: '🎓', show: canViewHosts },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈', show: canViewAnalytics },
    { to: '/admin/logs', label: 'Audit Logs', icon: '📋', show: canViewAudit },
    { to: '/admin/settings', label: 'Settings', icon: '⚙️', show: canManageSettings },
    { to: '/admin/management', label: 'Admins', icon: '🔑', show: isSuperAdmin },
  ].filter(item => item.show);

  return (
    <div className="admin-container">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-logo">
          <h2>EduTalk Admin</h2>
          <small>{role.replace('_', ' ')}</small>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className={`nav-item ${isActive(item.to) ? 'active' : ''}`}>
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="admin-footer">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-header">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="header-title">
            {/* Title is set by child pages */}
          </div>
        </div>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
};
