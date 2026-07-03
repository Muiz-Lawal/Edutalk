import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import '../styles/WaitingRoom.css';

export default function WaitingRoom({ streamId, classId, scheduledTime, hostInfo }) {
  const navigate = useNavigate();
  const [timeRemaining, setTimeRemaining] = useState('');
  const [streamLive, setStreamLive] = useState(false);
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Countdown timer
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const scheduled = new Date(scheduledTime);
      const diff = scheduled - now;

      if (diff <= 0) {
        setTimeRemaining('STARTING NOW!');
        return true;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      return false;
    };

    const isStarting = calculateTimeRemaining();
    const timer = setInterval(() => {
      const isNow = calculateTimeRemaining();
      if (isNow) {
        setStreamLive(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduledTime]);

  // Poll stream status
  useEffect(() => {
    const pollStreamStatus = async () => {
      try {
        const response = await api.get(`/live/${streamId}`);
        if (response.data.isLive) {
          setStreamLive(true);
        }
      } catch (err) {
        console.error('Stream status check failed:', err);
      }
    };

    const statusInterval = setInterval(pollStreamStatus, 5000);
    return () => clearInterval(statusInterval);
  }, [streamId]);

  // Fetch class info
  useEffect(() => {
    const fetchClassInfo = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/classes/${classId}`);
        setClassInfo(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching class info:', err);
        setError('Failed to load class information');
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchClassInfo();
    }
  }, [classId]);

  // Redirect when stream starts
  useEffect(() => {
    if (streamLive) {
      const timer = setTimeout(() => {
        navigate(`/watch/${streamId}`);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [streamLive, streamId, navigate]);

  if (loading) {
    return (
      <div className="waiting-room">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading stream information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-room">
      <div className="waiting-room-container">
        {/* Banner */}
        <div className="banner-section">
          <div className="going-live-banner">
            <h2>🎬 Going Live Soon!</h2>
            <div className="countdown-display">{timeRemaining}</div>
            {streamLive && <div className="redirect-message">Redirecting to live stream...</div>}
          </div>
        </div>

        <div className="waiting-room-content">
          {/* Left: Host Profile Card */}
          <div className="host-profile-card">
            <div className="card-header">Host Information</div>
            <div className="host-avatar">
              {hostInfo?.avatar ? (
                <img src={hostInfo.avatar} alt={hostInfo?.name} />
              ) : (
                <div className="avatar-placeholder">{hostInfo?.name?.[0]?.toUpperCase() || 'H'}</div>
              )}
            </div>
            <h3 className="host-name">{hostInfo?.name || 'Host'}</h3>
            <p className="host-bio">{hostInfo?.bio || 'Experienced instructor'}</p>
            <div className="host-stats">
              <div className="stat">
                <span className="stat-value">{hostInfo?.classCount || 0}</span>
                <span className="stat-label">Classes</span>
              </div>
              <div className="stat">
                <span className="stat-value">{hostInfo?.rating || '4.8'}</span>
                <span className="stat-label">Rating</span>
              </div>
            </div>
          </div>

          {/* Right: Class & Stream Info */}
          <div className="class-info-section">
            <div className="class-info-card">
              <div className="card-header">Class Information</div>
              <h2 className="class-title">{classInfo?.title || 'Upcoming Class'}</h2>
              <p className="class-description">{classInfo?.description || 'Get ready for an amazing learning experience'}</p>
              
              <div className="stream-details">
                <div className="detail-item">
                  <span className="label">Scheduled Start:</span>
                  <span className="value">{new Date(scheduledTime).toLocaleString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Enrolled:</span>
                  <span className="value">{classInfo?.enrolledCount || 0} students</span>
                </div>
                {classInfo?.category && (
                  <div className="detail-item">
                    <span className="label">Category:</span>
                    <span className="value">{classInfo.category}</span>
                  </div>
                )}
              </div>

              <div className="waiting-tips">
                <h4>While You Wait:</h4>
                <ul>
                  <li>✓ Make sure your audio and camera are working</li>
                  <li>✓ Find a quiet, well-lit location</li>
                  <li>✓ Have any materials ready you might need</li>
                  <li>✓ Check your internet connection</li>
                </ul>
              </div>
            </div>

            {/* Chat Section - Disabled */}
            <div className="chat-disabled-section">
              <div className="chat-header">Live Chat</div>
              <div className="chat-disabled-overlay">
                <p>💬 Chat will be available once the stream starts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
