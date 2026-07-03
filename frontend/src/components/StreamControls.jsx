import '../styles/StreamControls.css';

export default function StreamControls({
  isLive,
  loading,
  onStart,
  onStop,
  qualityLevel,
  onQualityChange,
}) {
  return (
    <div className="stream-controls">
      <div className="controls-main">
        {!isLive ? (
          <button
            onClick={onStart}
            disabled={loading}
            className="btn-primary btn-start"
            title="Start broadcasting to viewers"
          >
            {loading ? '⏳ Starting...' : '🔴 Start Streaming'}
          </button>
        ) : (
          <button
            onClick={onStop}
            disabled={loading}
            className="btn-danger btn-stop"
            title="Stop broadcasting and end stream"
          >
            {loading ? '⏳ Stopping...' : '⏹️ Stop Streaming'}
          </button>
        )}
      </div>

      {isLive && (
        <div className="controls-secondary">
          <div className="quality-selector">
            <label>Video Quality:</label>
            <select
              value={qualityLevel}
              onChange={(e) => onQualityChange(e.target.value)}
              disabled={loading}
              className="quality-select"
            >
              <option value="auto">Auto (Adaptive)</option>
              <option value="1080p">1080p (Best)</option>
              <option value="720p">720p (Good)</option>
              <option value="480p">480p (Fast)</option>
            </select>
          </div>

          <div className="stream-info-quick">
            <span className="info-badge">📡 Encoder: OBS/FFmpeg</span>
            <span className="info-badge">🎥 Codec: H.264</span>
          </div>
        </div>
      )}

      <div className="controls-tips">
        {!isLive ? (
          <p>
            👉 Set up your stream details above, then click <strong>Start Streaming</strong> to begin.
          </p>
        ) : (
          <p>
            ✅ Your stream is live! Configure your encoder with the RTMP credentials below.
          </p>
        )}
      </div>
    </div>
  );
}
