import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/ProfileDropdown.css';
import { Award, Bell, BookOpen, Check, CircleHelp, ClipboardList, CreditCard, Gift, GraduationCap, Home, LogOut, Palette, Settings, UserRound } from 'lucide-react';
import Badge from './ui/Badge';

const initialsFor = (user) => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
const displayName = (user) => [user?.firstName, user?.lastName].filter(Boolean).map((part) => part.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())).join(' ') || 'EduTalk learner';

export default function ProfileDropdown() {
  const { user, activeRole, setActiveRole, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);
  const avatarRef = useRef(null);
  const navigate = useNavigate();
  const hasHost = Boolean(user?.isHost);
  const hasStudent = user?.isStudent !== false;
  const roles = [
    ...(hasStudent ? ['Student'] : []),
    ...(hasHost ? ['Host'] : []),
    ...(user?.isAdmin || user?.adminRole ? ['Admin'] : []),
  ];

  useEffect(() => {
    let mounted = true;
    api.get('/notifications?limit=1')
      .then(({ data }) => mounted && setUnread(Number(data?.unreadCount || 0)))
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        avatarRef.current?.focus();
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const items = [...menuRef.current.querySelectorAll('a,button:not([aria-hidden="true"])')];
        const index = items.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown' ? (index + 1) % items.length : (index - 1 + items.length) % items.length;
        event.preventDefault();
        items[next]?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    menuRef.current?.querySelector('a,button')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const close = () => setOpen(false);
  const switchRole = (role) => {
    setActiveRole(role);
    close();
    navigate(role === 'host' ? '/host-dashboard' : '/dashboard');
  };
  const logoutNow = () => {
    logout();
    close();
    navigate('/');
  };
  const points = Number(user?.points || 0);
  const level = points > 0 ? 'Rising Learner' : 'New Learner';

  return (
    <div className="profile-menu" ref={menuRef}>
      <button ref={avatarRef} type="button" className="profile-avatar-button" aria-label="Open profile menu" aria-expanded={open} onClick={() => { setOpen(!open); setUnread(0); }}>
        {user?.profileImage ? <img src={`${user.profileImage}${user.profileImage.includes('?') ? '&' : '?'}v=${user.updatedAt || ''}`} alt="" /> : initialsFor(user)}
        {unread > 0 && <span className="profile-unread-dot" aria-label={`${unread} unread notifications`} />}
      </button>
      {open && (
        <div className="profile-dropdown" role="menu" aria-label="Profile menu">
          <div className="profile-identity">
            <div className="profile-avatar-large">{user?.profileImage ? <img src={user.profileImage} alt="" /> : initialsFor(user)}</div>
            <div><strong>{displayName(user)}</strong><span title={user?.email}>{user?.email}</span><div className="profile-role-chips">{roles.map((role) => <Badge key={role} variant="primary">{role}</Badge>)}</div></div>
          </div>
          <Link to="/points" onClick={close} className="profile-points"><Award size={16} /> {points} pts · {level}</Link>
          {points === 0 && <Link to="/dashboard" onClick={close} className="profile-points profile-nudge">Attend your first session to earn 10 pts →</Link>}
          {!user?.emailPreferences?.emailVerified && <Link to="/dashboard/settings#account" onClick={close} className="profile-warning">Verify your email to unlock full features</Link>}
          <div className="profile-divider" />
          <Link role="menuitem" to="/dashboard/profile" onClick={close}><UserRound className="profile-menu-icon" size={16} />My Profile</Link>
          {roles.length > 1 && !user?.isAdmin && <div className="profile-role-switch"><small>CONTINUE AS</small><button type="button" onClick={() => switchRole('student')} className={activeRole === 'student' ? 'selected' : ''}><Home className="profile-menu-icon" size={16} /><span>My Learning</span>{activeRole === 'student' && <Check size={16} aria-label="Active role" />}</button><button type="button" onClick={() => switchRole('host')} className={activeRole === 'host' ? 'selected' : ''}><GraduationCap className="profile-menu-icon" size={16} /><span>My Teaching</span>{activeRole === 'host' && <Check size={16} aria-label="Active role" />}</button></div>}
          <div className="profile-divider" />
          <Link role="menuitem" to="/dashboard" onClick={close}><BookOpen className="profile-menu-icon" size={16} />My Classes</Link>
          <Link role="menuitem" to="/payments" onClick={close}><CreditCard className="profile-menu-icon" size={16} />Payment History</Link>
          <Link role="menuitem" to="/refer" onClick={close}><Gift className="profile-menu-icon" size={16} />Refer &amp; Earn</Link>
          <div className="profile-divider" />
          <Link role="menuitem" to="/dashboard/settings" onClick={close}><Settings className="profile-menu-icon" size={16} />Settings</Link>
          <Link role="menuitem" to="/dashboard/settings#notifications" onClick={close}><Bell className="profile-menu-icon" size={16} />Notification Preferences</Link>
          <Link role="menuitem" to="/dashboard/settings#preferences" onClick={close}><Palette className="profile-menu-icon" size={16} />Theme: System</Link>
          <Link role="menuitem" to="/support" onClick={close}><CircleHelp className="profile-menu-icon" size={16} />Help &amp; Support</Link>
          {hasStudent && <Link role="menuitem" to="/appeals" onClick={close}><ClipboardList className="profile-menu-icon" size={16} />Appeals &amp; disputes</Link>}
          <div className="profile-divider" />
          <button type="button" className="profile-logout" onClick={logoutNow}><LogOut size={16} />Log out</button>
        </div>
      )}
    </div>
  );
}
