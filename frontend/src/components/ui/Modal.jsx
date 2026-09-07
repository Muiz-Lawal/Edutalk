import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './ui.css';

export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  return <div className="ui-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="ui-modal" role="dialog" aria-modal="true" aria-label={title}><header><h2>{title}</h2><button className="ui-button ui-button--ghost ui-button--sm" onClick={onClose} aria-label="Close"><X size={18} /></button></header>{children}</section></div>;
}
