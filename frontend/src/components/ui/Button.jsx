import React from 'react';
import { LoaderCircle } from 'lucide-react';
import './ui.css';

export default function Button({ variant = 'primary', size = 'md', loading = false, children, className = '', disabled, type = 'button', ...props }) {
  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`}
      type={type}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <><LoaderCircle className="ui-spinner" size={16} aria-label="Applying" />{children}</> : children}
    </button>
  );
}
