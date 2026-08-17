import React from 'react';
import '../styles/MessageBanner.css';

const MessageBanner = ({
  message,
  title,
  type = 'error',
  onClose,
  actionLabel,
  onAction,
}) => {
  if (!message) {
    return null;
  }

  const ariaLive = type === 'error' ? 'assertive' : 'polite';

  return (
    <div className={`message-banner message-banner--${type}`} role="alert" aria-live={ariaLive}>
      <div className="message-banner__content">
        <div className="message-banner__text">
          {title && <div className="message-banner__title">{title}</div>}
          <div className="message-banner__message">{message}</div>
        </div>

        <div className="message-banner__actions">
          {onAction && actionLabel && (
            <button className="message-banner__action" onClick={onAction} type="button">
              {actionLabel}
            </button>
          )}
          {onClose && (
            <button
              className="message-banner__close"
              onClick={onClose}
              type="button"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBanner;
