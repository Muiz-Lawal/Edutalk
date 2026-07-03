import '../styles/ViewerStats.css';

export default function ViewerStats({
  currentViewers,
  peakViewers,
  totalViewers,
  avgWatchTime,
  duration,
}) {
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatWatchTime = (minutes) => {
    if (!minutes || minutes === 0) return '—';
    if (minutes < 1) return '<1m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours}h`;
  };

  return (
    <div className="viewer-stats">
      <h3>📊 Live Analytics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Current Viewers</div>
          <div className="stat-value">{currentViewers}</div>
          <div className="stat-icon">👥</div>
        </div>

        <div className="stat-card peak">
          <div className="stat-label">Peak Viewers</div>
          <div className="stat-value">{peakViewers}</div>
          <div className="stat-icon">📈</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Joined</div>
          <div className="stat-value">{totalViewers}</div>
          <div className="stat-icon">✅</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg Watch Time</div>
          <div className="stat-value">{formatWatchTime(avgWatchTime)}</div>
          <div className="stat-icon">⏱️</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Stream Duration</div>
          <div className="stat-value">{formatTime(duration)}</div>
          <div className="stat-icon">⏰</div>
        </div>

        <div className="stat-card engagement">
          <div className="stat-label">Engagement</div>
          <div className="stat-value">
            {currentViewers > 0 && totalViewers > 0
              ? Math.round((currentViewers / totalViewers) * 100)
              : 0}
            %
          </div>
          <div className="stat-icon">💬</div>
        </div>
      </div>

      <div className="stats-note">
        💡 Stats update every 5 seconds. Share your playback URL with students to watch live.
      </div>
    </div>
  );
}
