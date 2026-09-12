import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  CircleHelp,
  DollarSign,
  GraduationCap,
  Headphones,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Palette,
  Settings,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeAdminRole, roleLabel } from '../lib/admin-rbac';
import '../styles/ProfileDropdown.css';

const ROLE_MENU_ITEMS = {
  super_admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Support', path: '/admin/support', icon: Headphones },
    { label: 'Moderation', path: '/admin/moderation', icon: Shield },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Hosts', path: '/admin/hosts', icon: GraduationCap },
    { label: 'Payments', path: '/admin/payments', icon: DollarSign },
    { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/logs', icon: ClipboardList },
    { label: 'Email Jobs', path: '/admin/email-jobs', icon: Mail },
    { label: 'Security', path: '/admin/security/dashboard', icon: ShieldCheck },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
    { label: 'Admins', path: '/admin/management', icon: KeyRound },
  ],
  admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Hosts', path: '/admin/hosts', icon: GraduationCap },
  ],
  finance_admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Payments', path: '/admin/payments', icon: DollarSign },
  ],
  moderator: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Moderation', path: '/admin/moderation', icon: Shield },
  ],
  support: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Support', path: '/admin/support', icon: Headphones },
  ],
};

const initialsFor = (user) => {
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  return initials || user?.email?.[0]?.toUpperCase() || 'A';
};

const displayName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email?.split('@')[0] || 'Admin';
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export default function AdminAvatarMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState('System');
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const role = normalizeAdminRole(user?.adminRole || user?.role);
  const menuItems = ROLE_MENU_ITEMS[role || 'admin'] || ROLE_MENU_ITEMS.admin;
  const currentSection =
    menuItems.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) ||
    menuItems[0];

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

      const items = Array.from(menuRef.current?.querySelectorAll('a, button') || []);
      const activeIndex = items.indexOf(document.activeElement);
      const nextIndex =
        event.key === 'ArrowDown'
          ? (activeIndex + 1) % items.length
          : (activeIndex - 1 + items.length) % items.length;

      if (!items.length) return;
      event.preventDefault();
      items[nextIndex]?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    menuRef.current?.querySelector('a, button')?.focus();

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!location.pathname.startsWith('/admin')) {
    return null;
  }

  const signOut = () => {
    logout();
    setOpen(false);
    navigate('/admin/login');
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        className="profile-avatar-button"
        aria-label="Open admin profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {user?.profileImage ? <img src={user.profileImage} alt="" /> : initialsFor(user)}
      </button>

      {open && (
        <div className="profile-dropdown admin-profile-dropdown" role="menu" aria-label="Admin profile menu">
          <div className="profile-identity">
            <div className="profile-avatar-large">{initialsFor(user)}</div>
            <div>
              <strong>{displayName(user)}</strong>
              <span title={user?.email}>{user?.email}</span>
              <div className={`admin-role-pill admin-role-pill--${role || 'admin'}`}>{roleLabel(role || user?.adminRole)}</div>
            </div>
          </div>

          <div className="profile-divider" />
          <div className="admin-menu-label">Admin</div>

          {menuItems.map(({ label, path, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={currentSection?.path === path ? 'admin-menu-current' : ''}
            >
              <Icon className="profile-menu-icon" size={18} />
              {label}
            </Link>
          ))}

          <div className="profile-divider" />
          <button
            type="button"
            role="menuitem"
            onClick={() => setTheme((current) => (current === 'System' ? 'Light' : current === 'Light' ? 'Dark' : 'System'))}
          >
            <Palette className="profile-menu-icon" size={18} />
            Theme: {theme}
          </button>
          <Link role="menuitem" to="/admin/support" onClick={() => setOpen(false)}>
            <CircleHelp className="profile-menu-icon" size={18} />
            Help &amp; support
          </Link>
          <div className="profile-divider" />
          <button type="button" role="menuitem" className="profile-logout" onClick={signOut}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
