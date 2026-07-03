import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import StreamSettings from '../components/StreamSettings';
import StreamControls from '../components/StreamControls';
import ViewerStats from '../components/ViewerStats';
import '../styles/LiveStreamHost.css';

export default function LiveStreamHost() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Stream state
  const [stream, setStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Viewer stats
  const [viewers, setViewers] = useState(0);
  const [peakViewers, setPeakViewers] = useState(0);
  const [totalViewers, setTotalViewers] = useState(0);
  const [avgWatchTime, setAvgWatchTime] = useState(0);

  // Stream settings
  const [streamTitle, setStreamTitle] = useState('');
  const [streamDescription, setStreamDescription] = useState('');
  const [qualityLevel, setQualityLevel] = useState('auto');

  // Timer
  const [streamDuration, setStreamDuration] = useState(0);
  const durationRef = useRef(null);

  // Get auth token
  const token = localStorage.getItem('token');

  // Initialize socket.io connection
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, navigate]);

  // Handle viewer count updates via Socket.io
  useEffect(() => {
    if (!socketRef.current || !stream) return;

    socketRef.current.on('stream:viewer-update', (data) => {
      setViewers(data.totalViewers);
      if (data.totalViewers > peakViewers) {
        setPeakViewers(data.totalViewers);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('stream:viewer-update');
      }
    };
  }, [stream, peakViewers]);

  // Fetch stream stats periodically
  useEffect(() => {
    if (!stream || !isLive) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/${stream._id}/stats`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setViewers(res.data.stats.currentViewers);
        setPeakViewers(res.data.stats.peakViewers);
        setTotalViewers(res.data.stats.totalViewers);
        setAvgWatchTime(res.data.stats.avgWatchTime || 0);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [stream, isLive, token]);

  // Timer for stream duration
  useEffect(() => {
    if (!isLive) {
      if (durationRef.current) clearInterval(durationRef.current);
      return;
    }

    durationRef.current = setInterval(() => {
      setStreamDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [isLive]);

  // Format duration as MM:SS or HH:MM:SS
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Create stream
  const handleCreateStream = async (title, description, duration) => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live`,
        {
          classId,
          title,
          description,
          duration: duration || 60,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStream(res.data.liveStream);
      setStreamTitle(title);
      setStreamDescription(description);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create stream';
      setError(message);
      console.error('Error creating stream:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start streaming
  const handleStartStream = async () => {
    try {
      setLoading(true);
      setError(null);

      const qualityConfig = {
        bitrates: [
          { level: '1080p', bitrate: 6000, resolution: '1920x1080' },
          { level: '720p', bitrate: 3000, resolution: '1280x720' },
          { level: '480p', bitrate: 1500, resolution: '854x480' },
        ],
        targetFps: 30,
        enableAdaptive: true,
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/${stream._id}/start`,
        { quality: qualityConfig },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStream(res.data.liveStream);
      setIsLive(true);
      setStreamDuration(0);
      setViewers(0);
      setPeakViewers(0);

      // Notify viewers via Socket.io
      if (socketRef.current) {
        socketRef.current.emit('stream:started', {
          streamId: res.data.liveStream._id,
          quality: qualityConfig,
        });
      }

      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to start stream';
      setError(message);
      console.error('Error starting stream:', err);
    } finally {
      setLoading(false);
    }
  };

  // Stop streaming
  const handleStopStream = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/${stream._id}/stop`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStream(res.data.liveStream);
      setIsLive(false);

      // Notify viewers via Socket.io
      if (socketRef.current) {
        socketRef.current.emit('stream:stopped', {
          streamId: stream._id,
        });
      }

      setError(null);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to stop stream';
      setError(message);
      console.error('Error stopping stream:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="live-stream-host">
      <div className="container">
        <header className="host-header">
          <h1>🎬 Go Live</h1>
          <p>Broadcast your class to students in real-time</p>
        </header>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {!stream ? (
          <div className="setup-section">
            <StreamSettings onCreateStream={handleCreateStream} loading={loading} />
          </div>
        ) : (
          <div className="streaming-section">
            {/* Status Bar */}
            <div className="status-bar">
              <div className="status-group">
                <div className={`status-badge ${isLive ? 'live' : 'offline'}`}>
                  <span className="status-dot"></span>
                  {isLive ? '🔴 LIVE' : '⚫ OFFLINE'}
                </div>

                {isLive && (
                  <div className="duration-display">
                    ⏱️ {formatDuration(streamDuration)}
                  </div>
                )}
              </div>

              <div className="title-display">
                <h2>{streamTitle}</h2>
              </div>

              <div className="status-group">
                <div className="viewer-count">
                  👥 {viewers} {viewers === 1 ? 'viewer' : 'viewers'}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="controls-section">
              <StreamControls
                isLive={isLive}
                loading={loading}
                onStart={handleStartStream}
                onStop={handleStopStream}
                qualityLevel={qualityLevel}
                onQualityChange={setQualityLevel}
              />
            </div>

            {/* Stats Display */}
            {isLive && (
              <div className="stats-section">
                <ViewerStats
                  currentViewers={viewers}
                  peakViewers={peakViewers}
                  totalViewers={totalViewers}
                  avgWatchTime={avgWatchTime}
                  duration={streamDuration}
                />
              </div>
            )}

            {/* RTMP Info (for OBS/encoders) */}
            {isLive && stream.playbackUrl && (
              <div className="rtmp-info">
                <h3>📡 Streaming Information</h3>
                <div className="info-group">
                  <label>RTMP URL:</label>
                  <code>{stream.rtmpUrl || 'rtmps://live.cloudflare.com:443/live/'}</code>
                </div>
                <div className="info-group">
                  <label>Stream Key:</label>
                  <code>{stream.streamKey}</code>
                </div>
                <div className="info-group">
                  <label>Playback URL:</label>
                  <code>{stream.playbackUrl}</code>
                </div>
                <p className="info-text">
                  Use the RTMP URL and Stream Key to configure your encoder (OBS, FFmpeg, etc.)
                </p>
              </div>
            )}

            {/* End Stream Button */}
            {stream && (
              <div className="stream-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setStream(null);
                    setIsLive(false);
                    setStreamDuration(0);
                  }}
                >
                  ← Back to Setup
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
