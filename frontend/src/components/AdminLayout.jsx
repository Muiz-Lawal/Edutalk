import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/admin.css';
import { useAuth } from '../context/AuthContext';
import { BarChart3, ClipboardList, DollarSign, GraduationCap, Headphones, KeyRound, LayoutDashboard, Mail, Menu, Settings, Shield, ShieldCheck, Users } from 'lucide-react';
import AdminAvatarMenu from './AdminAvatarMenu';
import { ADMIN_SECTIONS, canAccess } from '../lib/admin-rbac';

const displayName = (user) => [user?.firstName, user?.lastName].filter(Boolean).map((part) => part.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())).join(' ') || 'Admin';

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    localStorage.removeItem('sessionId');
    localStorage.removeItem('tempToken');
    navigate('/admin/login');
  };

  const role = user?.adminRole || 'admin';
  const navIcons = { LayoutDashboard, Headphones, Shield, Users, GraduationCap, DollarSign, BarChart3, ClipboardList, ShieldCheck, Settings, KeyRound, Mail };
  const navItems = ADMIN_SECTIONS.filter((section) => canAccess(role, section.key));
  const currentSection = ADMIN_SECTIONS.find((section) => location.pathname === section.path || location.pathname.startsWith(`${section.path}/`));

  return (
    <div className="admin-container">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-logo">
          <h2>EduTalk Admin</h2>
          <small>{displayName(user)}</small>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = navIcons[item.icon] || LayoutDashboard;
            return <Link key={item.path} to={item.path} className={`nav-item ${isActive(item.path) ? 'active' : ''}`}>
              <Icon className="icon" size={18} strokeWidth={2} />
              <span className="label">{item.label}</span>
            </Link>;
          })}
        </nav>

        <div className="admin-footer">
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="admin-sidebar-backdrop" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} />}

      <main className="admin-main">
        <div className="admin-header">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <Menu size={22} />
          </button>
          <div className="header-title">{currentSection?.label || 'Admin'}</div>
          <div className="admin-header-actions"><AdminAvatarMenu /></div>
        </div>

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
};
