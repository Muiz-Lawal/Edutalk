import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import HLSPlayer from '../components/HLSPlayer';
import ViewerChat from '../components/ViewerChat';
import StreamMetadata from '../components/StreamMetadata';
import QualitySelector from '../components/QualitySelector';
import '../styles/LiveStreamViewer.css';

export default function LiveStreamViewer() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);

  // Stream state
  const [stream, setStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Viewer stats
  const [viewers, setViewers] = useState(0);
  const [watchTime, setWatchTime] = useState(0);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [isChatBlocked, setIsChatBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Quality state
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);

  // Engagement tracking
  const [engagement, setEngagement] = useState(0);
  const joinedAtRef = useRef(Date.now());
  const watchTimeRef = useRef(null);

  // Get auth token
  const token = localStorage.getItem('token');

  // Fetch stream details on mount
  useEffect(() => {
    const fetchStream = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/streams/${streamId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStream(response.data);
        setIsLive(response.data.status === 'live');
        
        // Set available qualities from stream config
        if (response.data.quality?.bitrates) {
          setAvailableQualities(response.data.quality.bitrates);
        }
        
        // Fetch chat history
        fetchChatHistory();
      } catch (err) {
        console.error('Failed to fetch stream:', err);
        setError('Failed to load stream. Stream may not exist or be archived.');
        setTimeout(() => navigate('/'), 5000);
      } finally {
        setLoading(false);
      }
    };

    if (streamId) {
      fetchStream();
    }
  }, [streamId, token, navigate]);

  // Track viewer join
  useEffect(() => {
    const trackJoin = async () => {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/${streamId}/viewer-join`,
          {
            qualitySelected: selectedQuality,
            browser: getBrowserInfo(),
            os: getOSInfo()
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Failed to track viewer join:', err);
      }
    };

    if (stream && token) {
      trackJoin();
    }
  }, [stream, streamId, token, selectedQuality]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!stream || !token) return;

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Join stream room
    socketRef.current.emit('stream:join', { streamId });

    // Listen for real-time updates
    socketRef.current.on('stream:viewer-update', (data) => {
      setViewers(data.totalViewers || 0);
    });

    socketRef.current.on('stream:chat-message', (data) => {
      setMessages((prev) => [...prev, data]);
      // Calculate engagement based on chat activity
      setEngagement((prev) => Math.min(prev + 5, 100));
    });

    socketRef.current.on('stream:stats', (data) => {
      if (data.streamHealth?.qualityAvailable) {
        setAvailableQualities(data.streamHealth.qualityAvailable);
      }
    });

    socketRef.current.on('stream:stopped', () => {
      setIsLive(false);
      setTimeout(() => {
        setError('This stream has ended.');
      }, 500);
    });

    socketRef.current.on('stream:quality', (data) => {
      if (data.availableLevels) {
        setAvailableQualities(data.availableLevels);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('stream:leave', { streamId });
        socketRef.current.disconnect();
      }
    };
  }, [stream, streamId, token]);

  // Start watch time timer
  useEffect(() => {
    watchTimeRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - joinedAtRef.current) / 1000);
      setWatchTime(elapsed);
      
      // Calculate engagement based on watch time
      if (elapsed > 0) {
        setEngagement((prev) => Math.min(prev + 0.5, 100));
      }
    }, 1000);

    return () => clearInterval(watchTimeRef.current);
  }, []);

  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/${streamId}/chat?limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data || []);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  // Handle sending message
  const handleSendMessage = async (messageText) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/${streamId}/chat`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 403) {
        setIsChatBlocked(true);
        setBlockReason(response.data?.reason || 'You are temporarily muted');
        setTimeout(() => setIsChatBlocked(false), 60000); // 1 minute timeout
      } else {
        // Message sent successfully, increment engagement
        setEngagement((prev) => Math.min(prev + 10, 100));
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setIsChatBlocked(true);
        setBlockReason(err.response.data?.reason || 'You are temporarily muted');
      } else {
        console.error('Failed to send message:', err);
      }
    }
  };

  // Handle quality change
  const handleQualityChange = (quality) => {
    setSelectedQuality(quality);
    if (socketRef.current) {
      socketRef.current.emit('stream:quality', { streamId, quality });
    }
  };

  // Track viewer leave
  const handleBeforeUnload = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/live/${streamId}/viewer-leave`,
        {
          watchTime,
          engagement: Math.round(engagement)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error('Failed to track viewer leave:', err);
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [watchTime, engagement, streamId, token]);

  if (loading) {
    return (
      <div className="livestream-viewer-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="livestream-viewer-error">
        <div className="error-message">
          <h2>⚠️ Unable to Load Stream</h2>
          <p>{error}</p>
          <p style={{ fontSize: '0.9rem', color: '#999' }}>Redirecting to home...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="livestream-viewer-error">
        <div className="error-message">
          <h2>Stream not found</h2>
          <p>The stream you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="livestream-viewer-page">
      <div className="video-section">
        <HLSPlayer
          streamId={streamId}
          quality={selectedQuality}
          onQualityChange={handleQualityChange}
          isLive={isLive}
        />

        <StreamMetadata
          title={stream.title}
          description={stream.description}
          hostName={stream.hostName}
          hostAvatar={stream.hostAvatar}
          viewers={viewers}
          category={stream.category}
          startedAt={stream.startedAt}
          isLive={isLive}
        />
      </div>

      <div className="sidebar">
        <QualitySelector
          options={availableQualities}
          selected={selectedQuality}
          onChange={handleQualityChange}
        />

        <div className="viewer-stats-card">
          <h3>Stream Info</h3>
          <div className="stat-item">
            <span className="label">Current Viewers</span>
            <span className="value">{viewers}</span>
          </div>
          <div className="stat-item">
            <span className="label">Watch Time</span>
            <span className="value">{formatWatchTime(watchTime)}</span>
          </div>
          <div className="stat-item">
            <span className="label">Engagement</span>
            <div className="engagement-bar">
              <div className="engagement-fill" style={{ width: `${engagement}%` }}></div>
            </div>
          </div>
          <div className="stat-item">
            <span className="label">Status</span>
            <span className={`status-badge ${isLive ? 'live' : 'ended'}`}>
              {isLive ? '🔴 Live' : '⚫ Ended'}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-section">
        <ViewerChat
          streamId={streamId}
          messages={messages}
          onSendMessage={handleSendMessage}
          isModerated={stream.chatModerated}
          isBlocked={isChatBlocked}
          blockReason={blockReason}
        />
      </div>
    </div>
  );
}

// Utility functions
function formatWatchTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOSInfo() {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  if (ua.includes('Android')) return 'Android';
  return 'Unknown';
}
