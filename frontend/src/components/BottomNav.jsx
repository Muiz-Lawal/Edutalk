import { useEffect } from 'react';
import { Compass, LayoutDashboard, PlayCircle, ShoppingCart, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCartStore } from '../stores/cartStore';
import '../styles/mobile-nav.css';

const navItems = [
  { path: '/browse', label: 'Browse', Icon: Compass },
  { path: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { path: '/recordings', label: 'Recordings', Icon: PlayCircle },
  { path: '/cart', label: 'Cart', Icon: ShoppingCart },
  { path: '/dashboard/profile', label: 'Profile', Icon: UserRound },
];

export default function BottomNav() {
  const location = useLocation();
  const { user, isAuthenticated, activeRole } = useAuth();
  const cartCount = useCartStore((state) => state.lines.length);
  const isAdmin = activeRole === 'admin' || Boolean(user?.isAdmin || user?.adminRole);
  const isHiddenPath = location.pathname.startsWith('/admin')
    || location.pathname.startsWith('/session')
    || location.pathname.startsWith('/host')
    || location.pathname.startsWith('/host-dashboard')
    || location.pathname.startsWith('/go-live')
    || location.pathname.startsWith('/analytics')
    || location.pathname.startsWith('/schedules')
    || location.pathname.startsWith('/create-class')
    || location.pathname.startsWith('/create-bundle')
    || ['/login', '/signup', '/register', '/verify-email'].includes(location.pathname);
  const isVisible = isAuthenticated && activeRole === 'student' && !isAdmin && !isHiddenPath;

  useEffect(() => {
    document.body.classList.toggle('student-bottom-nav-active', isVisible);
    return () => document.body.classList.remove('student-bottom-nav-active');
  }, [isVisible]);

  if (!isVisible) return null;

  const avatar = user?.avatarUrl || user?.profileImage || user?.profilePicture || user?.profile?.avatarUrl;
  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  return (
    <nav className="student-bottom-nav" aria-label="Student navigation">
      {navItems.map(({ path, label, Icon }) => {
        const isActive = path === '/dashboard'
          ? location.pathname === '/dashboard' || location.pathname === '/dashboard/settings'
          : location.pathname === path
            || (path !== '/browse' && location.pathname.startsWith(`${path}/`));
        return (
          <Link
            key={path}
            to={path}
            className={`student-bottom-nav__item${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {path === '/dashboard/profile' && avatar ? (
              <img className="student-bottom-nav__avatar" src={avatar} alt="" />
            ) : path === '/dashboard/profile' ? (
              <span className="student-bottom-nav__avatar student-bottom-nav__avatar--initials" aria-hidden="true">
                {initials}
              </span>
            ) : (
              <span className="student-bottom-nav__icon-wrap">
                <Icon size={22} strokeWidth={2} aria-hidden="true" />
                {path === '/cart' && cartCount > 0 && (
                  <span className="student-bottom-nav__badge" aria-label={`${cartCount} items in cart`}>
                    {cartCount}
                  </span>
                )}
              </span>
            )}
            <span className="student-bottom-nav__label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
