import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/mobile-nav.css';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleMenuItemClick = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  const menuItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/browse', icon: '🎓', label: 'Browse Classes' },
    { path: '/my-classes', icon: '📚', label: 'My Classes' },
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/settings', icon: '⚙️', label: 'Settings' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <>
      <button
        className="mobile-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <div className={`hamburger ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={`mobile-menu ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}>
        <div className="mobile-menu__panel" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-menu__header">
            <h3 style={{ margin: 0, fontSize: '18px' }}>EduTalk</h3>
            <button
              className="mobile-menu__close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="mobile-menu__body">
            {menuItems.map((item) => (
              <button
                key={item.path}
                className="mobile-menu__item"
                onClick={() => handleMenuItemClick(item.path)}
              >
                <span style={{ marginRight: '12px' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
