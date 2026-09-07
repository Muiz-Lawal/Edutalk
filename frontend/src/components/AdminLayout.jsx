import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import { useAuth } from '../context/AuthContext';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { BarChart3, ClipboardList, DollarSign, GraduationCap, Headphones, KeyRound, LayoutDashboard, Mail, Menu, Settings, Shield, ShieldCheck, Users } from 'lucide-react';

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

  const canViewSupport = hasPermission('view_support_dashboard') || isSupport || isSuperAdmin;
  const canModerate = (hasPermission('moderate_content') && !isFinanceAdmin) || isModerator || isSuperAdmin;
  const canViewPayments = hasPermission('view_payments') || isFinanceAdmin || isSuperAdmin;
  const canViewAudit = hasPermission('view_audit_logs') || isFinanceAdmin || isSuperAdmin;
  const canManageSettings = hasPermission('manage_admins') && isSuperAdmin;
  const canManageUsers = hasPermission('manage_users') || isSuperAdmin;
  const canViewUserProfiles = hasPermission('view_user_profiles_readonly') || isSupport || isSuperAdmin;
  const canViewHosts = hasPermission('manage_hosts') || isSuperAdmin;
  const canViewAnalytics = role === 'admin' || isSuperAdmin || role === 'finance_admin';
  const canManageEmailJobs = role === 'admin' || isSuperAdmin;
  const canViewSecurity = hasPermission('view_security_alerts') || isSuperAdmin;

  const allNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, show: true },
    { to: '/admin/support', label: 'Support', icon: Headphones, show: canViewSupport },
    { to: '/admin/users', label: 'Users', icon: Users, show: canManageUsers || canViewUserProfiles },
    { to: '/admin/moderation', label: 'Moderation', icon: Shield, show: canModerate },
    { to: '/admin/payments', label: 'Payments', icon: DollarSign, show: canViewPayments },
    { to: '/admin/hosts', label: 'Hosts', icon: GraduationCap, show: canViewHosts },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3, show: canViewAnalytics },
    { to: '/admin/logs', label: 'Audit Logs', icon: ClipboardList, show: canViewAudit },
    { to: '/admin/email-jobs', label: 'Email Jobs', icon: Mail, show: canManageEmailJobs },
    { to: '/admin/security/dashboard', label: 'Security', icon: ShieldCheck, show: canViewSecurity },
    { to: '/admin/settings', label: 'Settings', icon: Settings, show: canManageSettings },
    { to: '/admin/management', label: 'Admins', icon: KeyRound, show: isSuperAdmin },
  ];

  const navItems = allNavItems.filter(item => item.show);

  if (isSupport) {
    return (
      <div className="admin-container">
        <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="admin-logo">
            <h2>EduTalk Support</h2>
            <small>{role.replace('_', ' ')}</small>
          </div>
          <nav className="admin-nav">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={`nav-item ${isActive(item.to) ? 'active' : ''}`}>
                <item.icon className="icon" size={18} strokeWidth={2} />
                <span className="label">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="admin-footer">
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </aside>
        <main className="admin-main">
          <div className="admin-header">
            <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar"><Menu size={22} /></button>
            <div className="header-title" />
          </div>
          <div className="admin-content">{children}</div>
        </main>
      </div>
    );
  }

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
              <item.icon className="icon" size={18} strokeWidth={2} />
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
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <Menu size={22} />
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
