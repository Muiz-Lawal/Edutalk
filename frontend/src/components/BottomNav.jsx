import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/mobile-nav.css';

export default function BottomNav() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/browse', icon: '🎓', label: 'Browse' },
    { path: '/my-classes', icon: '📚', label: 'Classes' },
    { path: '/profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav__item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
