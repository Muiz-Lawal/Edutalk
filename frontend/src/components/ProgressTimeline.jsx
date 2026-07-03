import React from 'react';
import '../styles/ProgressTimeline.css';

const ProgressTimeline = ({ 
  events = [], 
  title = 'Activity Timeline'
}) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventIcon = (eventType) => {
    const icons = {
      session: '📺',
      quiz: '📝',
      assessment: '✅',
      assignment: '📄',
      attendance: '✓',
      achievement: '🏆',
      participation: '💬',
      milestone: '🎯',
      completion: '🎓'
    };
    return icons[eventType] || '📍';
  };

  const getEventColor = (eventType) => {
    const colors = {
      session: '#3b82f6',
      quiz: '#f59e0b',
      assessment: '#22c55e',
      assignment: '#8b5cf6',
      attendance: '#06b6d4',
      achievement: '#ec4899',
      participation: '#14b8a6',
      milestone: '#f59e0b',
      completion: '#22c55e'
    };
    return colors[eventType] || '#6b7280';
  };

  if (!events || events.length === 0) {
    return (
      <div className="progress-timeline">
        <h3 className="progress-timeline__title">{title}</h3>
        <div className="progress-timeline__empty">
          <p>No activity yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-timeline">
      <h3 className="progress-timeline__title">{title}</h3>
      <div className="progress-timeline__container">
        <div className="progress-timeline__line"></div>
        
        {events.map((event, index) => (
          <div 
            key={event.id || index}
            className="progress-timeline__event"
          >
            <div className="progress-timeline__marker">
              <div 
                className="progress-timeline__dot"
                style={{ borderColor: getEventColor(event.type) }}
              >
                <span className="progress-timeline__dot-icon">
                  {getEventIcon(event.type)}
                </span>
              </div>
            </div>
            
            <div className="progress-timeline__content">
              <div className="progress-timeline__header">
                <h4 className="progress-timeline__event-title">{event.title}</h4>
                <span className="progress-timeline__date">
                  {formatDate(event.date || new Date())}
                </span>
              </div>
              
              {event.description && (
                <p className="progress-timeline__description">
                  {event.description}
                </p>
              )}
              
              {event.metadata && (
                <div className="progress-timeline__metadata">
                  {event.metadata.score !== undefined && (
                    <span className="progress-timeline__meta-item">
                      Score: <strong>{event.metadata.score}%</strong>
                    </span>
                  )}
                  {event.metadata.duration && (
                    <span className="progress-timeline__meta-item">
                      Duration: <strong>{event.metadata.duration}</strong>
                    </span>
                  )}
                  {event.metadata.points && (
                    <span className="progress-timeline__meta-item">
                      Points: <strong>+{event.metadata.points}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressTimeline;
