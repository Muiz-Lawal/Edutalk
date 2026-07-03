import { useState, useEffect, useRef } from 'react';
import '../styles/HLSPlayer.css';

export default function HLSPlayer({ streamId, quality, onQualityChange, isLive }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBitrate, setCurrentBitrate] = useState('Auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    bitrate: 0,
    framerate: 0,
    droppedFrames: 0
  });

  // Initialize HLS player
  useEffect(() => {
    const initHLS = async () => {
      try {
        // Dynamic import of HLS.js to avoid issues if not installed yet
        let Hls;
        try {
          Hls = (await import("hls.js")).default;
        } catch (err) {
          console.warn('HLS.js not installed, falling back to native HLS support');
          // Use native HLS support (Safari)
          if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            const manifestUrl = `https://videodelivery.net/${streamId}/manifest/video.m3u8`;
            videoRef.current.src = manifestUrl;
            setLoading(false);
            return;
          }
          throw new Error('HLS not supported in this browser');
        }

        if (!Hls.isSupported()) {
          throw new Error('HLS not supported in this browser');
        }

        const manifestUrl = `https://videodelivery.net/${streamId}/manifest/video.m3u8`;

        const hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });

        hls.loadSource(manifestUrl);
        hls.attachMedia(videoRef.current);

        // Events
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed, quality levels available:', hls.levels.length);
          setLoading(false);
          videoRef.current.play().catch(() => {
            // Autoplay failed, user will click play
          });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            setError(`Stream error: ${data.details}`);
          }
        });

        hls.on(Hls.Events.hlsLevelSwitching, (event, data) => {
          if (hls.levels[data.level]) {
            const levelName = hls.levels[data.level].name || hls.levels[data.level].bitrate;
            setCurrentBitrate(levelName);
            onQualityChange?.(levelName);
          }
        });

        hls.on(Hls.Events.statsUpdated, (event, data) => {
          setNetworkStats({
            bitrate: Math.round(data.bitrate / 1000),
            framerate: Math.round(data.framesDecoded / (data.audioSamples / 48000)) || 0,
            droppedFrames: data.framesDropped || 0
          });
        });

        hlsRef.current = hls;

        // Start stats polling
        const statsInterval = setInterval(() => {
          if (videoRef.current && hlsRef.current) {
            const level = hlsRef.current.currentLevel;
            if (level >= 0 && hlsRef.current.levels[level]) {
              const name = hlsRef.current.levels[level].name || 
                          `${hlsRef.current.levels[level].height}p`;
              setCurrentBitrate(name);
            }
          }
        }, 2000);

        return () => {
          clearInterval(statsInterval);
          hls.destroy();
        };
      } catch (err) {
        console.error('Failed to initialize HLS:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (streamId && videoRef.current) {
      initHLS();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamId, onQualityChange]);

  // Handle quality change
  useEffect(() => {
    if (!hlsRef.current || !quality) return;

    if (quality === 'auto') {
      hlsRef.current.currentLevel = -1;
      setCurrentBitrate('Auto');
    } else {
      const levelIndex = hlsRef.current.levels.findIndex(
        (level) => {
          const name = level.name || `${level.height}p`;
          return name === quality || name.includes(quality);
        }
      );

      if (levelIndex >= 0) {
        hlsRef.current.currentLevel = levelIndex;
        const level = hlsRef.current.levels[levelIndex];
        setCurrentBitrate(level.name || `${level.height}p`);
      }
    }
  }, [quality]);

  // Handle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          // Lock portrait for mobile
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape').catch(() => {});
          }
          setIsFullscreen(true);
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          // Unlock orientation
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Handle fullscreen change event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle video click for fullscreen
  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Handle double-click for fullscreen
  const handleVideoDoubleClick = () => {
    toggleFullscreen();
  };

  return (
    <div className="hls-player-container">
      {loading && (
        <div className="player-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="player-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <small>Trying to reconnect...</small>
          </div>
        </div>
      )}

      <div className={`hls-player ${loading ? 'loading' : ''} ${error ? 'error' : ''} ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
        <video
          ref={videoRef}
          controls
          autoPlay
          muted={false}
          className="video-element"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect fill='%23000' width='1280' height='720'/%3E%3C/svg%3E"
          onClick={handleVideoClick}
          onDoubleClick={handleVideoDoubleClick}
        />

        <button 
          className="fullscreen-button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>

        <div className="player-stats">
          <div className="stat-badge">
            <span className="stat-label">Quality:</span>
            <span className="stat-value">{currentBitrate}</span>
          </div>
          {networkStats.bitrate > 0 && (
            <div className="stat-badge">
              <span className="stat-label">Bitrate:</span>
              <span className="stat-value">{networkStats.bitrate} kbps</span>
            </div>
          )}
          {isLive && <div className="live-badge">🔴 LIVE</div>}
        </div>
      </div>

      <div className="player-footer">
        <p className="stream-quality-info">
          Video quality: {currentBitrate}
          {networkStats.bitrate > 0 && ` • ${networkStats.bitrate} kbps`}
        </p>
      </div>
    </div>
  );
}
