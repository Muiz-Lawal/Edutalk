import React from 'react';
import '../styles/ProgressCard.css';

const ProgressCard = ({ 
  title, 
  percentage, 
  daysElapsed, 
  daysRemaining,
  enrollmentId,
  onClick,
  isCompletionCard = false 
}) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const getColorByPercentage = () => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="progress-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="progress-card__header">
        <h3 className="progress-card__title">{title}</h3>
        {isCompletionCard && <span className="progress-card__badge">Completed</span>}
      </div>

      <div className="progress-card__body">
        <div className="progress-card__circle-container">
          <svg width="120" height="120" viewBox="0 0 120 120" className="progress-card__svg">
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={getColorByPercentage()}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              className="progress-card__progress-circle"
            />
          </svg>
          <div className="progress-card__percentage">
            <span className="progress-card__percentage-value">{Math.round(percentage)}%</span>
          </div>
        </div>

        <div className="progress-card__stats">
          {daysElapsed !== undefined && (
            <div className="progress-card__stat">
              <span className="progress-card__stat-label">Days Elapsed</span>
              <span className="progress-card__stat-value">{daysElapsed}</span>
            </div>
          )}
          {daysRemaining !== undefined && (
            <div className="progress-card__stat">
              <span className="progress-card__stat-label">Days Remaining</span>
              <span className="progress-card__stat-value">{Math.max(0, daysRemaining)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
