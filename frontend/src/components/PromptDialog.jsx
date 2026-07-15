import React, { useEffect, useState } from 'react';
import '../styles/PromptDialog.css';

export default function PromptDialog({ open, title, label = '', defaultValue = '', placeholder = '', onConfirm, onCancel, confirmLabel = 'OK', cancelLabel = 'Cancel' }) {
  const [value, setValue] = useState(defaultValue || '');

  useEffect(() => {
    if (open) setValue(defaultValue || '');
  }, [open, defaultValue]);

  if (!open) return null;

  return (
    <div className="prompt-overlay" role="dialog" aria-modal="true" aria-labelledby="prompt-title">
      <div className="prompt-dialog">
        <h3 id="prompt-title">{title}</h3>
        {label && <label className="prompt-label">{label}</label>}
        <input
          className="prompt-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <div className="prompt-actions">
          <button className="btn btn-secondary" onClick={() => onCancel && onCancel()}>{cancelLabel}</button>
          <button className="btn btn-primary" onClick={() => onConfirm && onConfirm(value)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
