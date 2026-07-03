import React, { useEffect, useState } from 'react';
import { subscribe } from '../utils/toastManager';
import { Link } from 'react-router-dom';
import '../styles/Toast.css';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = subscribe((t) => {
      setToasts((prev) => [t, ...prev]);
      // Auto remove
      setTimeout(() => {
        setToasts((prev) => prev.filter((p) => p.id !== t.id));
      }, t.ttl || 5000);
    });

    return () => unsub();
  }, []);

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-title">{t.title}</div>
          <div className="toast-message">{t.message}</div>
          {t.action && (
            <div className="toast-action">
              {t.action.url ? (
                <Link to={t.action.url} className="toast-action-link">{t.action.label || 'View'}</Link>
              ) : (
                <button onClick={t.action.onClick} className="toast-action-link">{t.action.label || 'View'}</button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
