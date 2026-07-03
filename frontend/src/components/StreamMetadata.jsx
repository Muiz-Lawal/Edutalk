import '../styles/StreamMetadata.css';

export default function StreamMetadata({
  title,
  description,
  hostName,
  hostAvatar,
  viewers,
  category,
  startedAt,
  isLive
}) {
  const formatStartTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };

  const calculateStreamDuration = (startTime) => {
    if (!startTime) return '';
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="stream-metadata">
      <div className="metadata-header">
        <h1 className="stream-title">{title}</h1>
        <div className="metadata-badges">
          <span className={`status-badge ${isLive ? 'live' : 'offline'}`}>
            {isLive ? '🔴 LIVE' : '⚫ ENDED'}
          </span>
          {category && <span className="category-badge">{category}</span>}
          {viewers > 0 && <span className="viewers-badge">👥 {viewers} watching</span>}
        </div>
      </div>

      <div className="host-info">
        {hostAvatar && (
          <img src={hostAvatar} alt={hostName} className="host-avatar" />
        )}
        <div className="host-details">
          <p className="host-label">Hosted by</p>
          <p className="host-name">{hostName}</p>
          <p className="stream-timing">
            {isLive ? (
              <>
                <span>🔴 Live for {calculateStreamDuration(startedAt)}</span>
              </>
            ) : (
              <>
                <span>Ended {formatStartTime(startedAt)}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {description && (
        <div className="stream-description">
          <details>
            <summary>About this stream</summary>
            <p>{description}</p>
          </details>
        </div>
      )}

      <div className="stream-stats-row">
        <div className="stat-item">
          <span className="stat-label">Viewers</span>
          <span className="stat-value">{viewers || 0}</span>
        </div>
        {isLive && (
          <div className="stat-item">
            <span className="stat-label">Duration</span>
            <span className="stat-value">{calculateStreamDuration(startedAt)}</span>
          </div>
        )}
        {category && (
          <div className="stat-item">
            <span className="stat-label">Category</span>
            <span className="stat-value">{category}</span>
          </div>
        )}
      </div>
    </div>
  );
}
