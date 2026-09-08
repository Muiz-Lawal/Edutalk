import React from 'react';
import './ui.css';

export default function Badge({ variant = 'neutral', children }) {
  return <span className={`ui-badge ui-badge--${variant}`}>{children}</span>;
}
