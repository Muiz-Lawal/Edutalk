import React from 'react';
import './ui.css';

export default function Skeleton({ className = '' }) {
  return <span className={`ui-skeleton ${className}`} aria-hidden="true" />;
}
