import React from 'react';
import '../styles/ScheduleCard.css';

export default function ScheduleCard({ schedule, onEdit, onCancel, onViewDetails }) {
  const getStatusBadge = (status) => {
    const statusMap = {
      'scheduled': { color: 'blue', label: 'Scheduled' },
      'live': { color: 'red', label: 'Live' },
      'completed': { color: 'green', label: 'Completed' },
      'cancelled': { color: 'grey', label: 'Cancelled' }
    };
    return statusMap[status] || statusMap['scheduled'];
  };

  const calculateTimeUntil = (scheduledTime) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diff = scheduled - now;

    if (diff < 0) return 'Started';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const statusBadge = getStatusBadge(schedule.status);
  const timeUntil = schedule.status === 'scheduled' ? calculateTimeUntil(schedule.scheduledStartTime) : null;

  return (
    <div className="schedule-card">
      <div className="card-content">
        <div className="card-header-row">
          <div className="title-section">
            <h3 className="schedule-title">{schedule.title}</h3>
            <span className={`status-badge status-${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </div>
          {timeUntil && <span className="time-until">{timeUntil}</span>}
        </div>

        <div className="schedule-details">
          <div className="detail-item">
            <span className="label">📅 Date & Time:</span>
            <span className="value">
              {new Date(schedule.scheduledStartTime).toLocaleString()}
            </span>
          </div>

          <div className="detail-item">
            <span className="label">👤 Host:</span>
            <span className="value">{schedule.hostName || 'Unknown Host'}</span>
          </div>

          <div className="detail-item">
            <span className="label">👥 Attendance:</span>
            <span className="value">
              {schedule.enrolledCount || 0} / {schedule.expectedCount || schedule.enrolledCount || 0}
            </span>
          </div>

          {schedule.description && (
            <div className="detail-item full-width">
              <span className="label">📝 Description:</span>
              <span className="value truncated">{schedule.description}</span>
            </div>
          )}

          {schedule.recurrence && schedule.recurrence !== 'once' && (
            <div className="detail-item">
              <span className="label">🔄 Recurrence:</span>
              <span className="value">{schedule.recurrence}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card-actions">
        {schedule.status !== 'completed' && schedule.status !== 'cancelled' && (
          <>
            {onEdit && (
              <button 
                className="action-btn edit-btn"
                onClick={() => onEdit(schedule)}
                title="Edit this schedule"
              >
                ✏️ Edit
              </button>
            )}
            {onCancel && (
              <button 
                className="action-btn cancel-btn"
                onClick={() => onCancel(schedule)}
                title="Cancel this schedule"
              >
                ✕ Cancel
              </button>
            )}
          </>
        )}
        {onViewDetails && (
          <button 
            className="action-btn details-btn"
            onClick={() => onViewDetails(schedule)}
            title="View full details"
          >
            👁️ Details
          </button>
        )}
      </div>
    </div>
  );
}
