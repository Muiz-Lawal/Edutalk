import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import '../styles/AsyncBoundary.css';

export function Skeleton({ variant = 'block', count = 1 }) {
  return <div className={`async-skeleton async-skeleton--${variant}`} aria-hidden="true">
    {Array.from({ length: count }, (_, index) => <span key={index} />)}
  </div>;
}

export default function AsyncBoundary({
  loading,
  error,
  empty = false,
  onRetry,
  onBack,
  loadingVariant = 'block',
  emptyMessage = 'There is nothing to show yet.',
  emptyAction,
  errorMessage = 'We couldn’t load this content',
  errorDetail = 'Please try again.',
  loadingFallback,
  children,
}) {
  if (loading) return loadingFallback || <Skeleton variant={loadingVariant} />;
  if (error) return (
    <div className="async-state async-state--error" role="alert">
      <AlertCircle size={22} />
      <div><strong>{errorMessage}</strong><p>{errorDetail}</p></div>
      <div className="async-state__actions">
        <button type="button" onClick={onRetry}><RefreshCw size={15} /> Retry</button>
        {onBack && <button type="button" className="async-state__back" onClick={onBack}>Go back</button>}
      </div>
    </div>
  );
  if (empty) return (
    <div className="async-state async-state--empty">
      <Inbox size={24} /><p>{emptyMessage}</p>{emptyAction}
    </div>
  );
  return children;
}
