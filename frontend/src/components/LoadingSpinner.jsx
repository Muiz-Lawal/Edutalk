import React from 'react';
import '../styles/LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * Reusable loading indicator with multiple variants
 */
const LoadingSpinner = ({ 
  variant = 'centered', 
  size = 'medium', 
  message = 'Loading...',
  fullPage = false 
}) => {
  if (fullPage) {
    return (
      <div className="loading-spinner__fullpage">
        <div className="loading-spinner__container">
          <div className={`loading-spinner loading-spinner--${size}`}></div>
          <p className="loading-spinner__message">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-spinner__wrapper loading-spinner__wrapper--${variant}`}>
      <div className={`loading-spinner loading-spinner--${size}`}></div>
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
