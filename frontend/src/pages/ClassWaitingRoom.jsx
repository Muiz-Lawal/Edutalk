import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import WaitingRoom from '../components/WaitingRoom';
import '../styles/ClassWaitingRoom.css';

export default function ClassWaitingRoom() {
  const { streamId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamData, setStreamData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [hostInfo, setHostInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch stream details
        const streamResponse = await api.get(`/live/${streamId}`);
        setStreamData(streamResponse.data);

        // Fetch class details
        if (streamResponse.data.classId) {
          const classResponse = await api.get(`/classes/${streamResponse.data.classId}`);
          setClassData(classResponse.data);

          // Fetch host info
          if (classResponse.data.hostId) {
            try {
              const hostResponse = await api.get(`/users/${classResponse.data.hostId}`);
              setHostInfo(hostResponse.data);
            } catch (err) {
              console.warn('Could not fetch host info:', err);
              // Set basic host info from class data
              setHostInfo({
                name: classResponse.data.hostName || 'Instructor',
                bio: 'Experienced instructor'
              });
            }
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching stream data:', err);
        
        if (err.response?.status === 404) {
          setError('Stream not found. This stream may have ended or been removed.');
        } else if (err.response?.status === 403) {
          setError('You do not have permission to access this stream.');
        } else {
          setError('Failed to load stream information. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (streamId) {
      fetchData();
    }
  }, [streamId]);

  if (loading) {
    return (
      <div className="class-waiting-room-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-waiting-room-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Unable to Load Stream</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()} className="retry-btn">
              🔄 Retry
            </button>
            <button onClick={() => navigate('/')} className="home-btn">
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!streamData) {
    return (
      <div className="class-waiting-room-page">
        <div className="offline-container">
          <div className="offline-icon">📺</div>
          <h2>Stream is Offline</h2>
          <p>This stream has ended or is not currently available.</p>
          <button onClick={() => navigate('/')} className="home-btn">
            🏠 Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="class-waiting-room-page">
      <WaitingRoom
        streamId={streamId}
        classId={streamData.classId}
        scheduledTime={streamData.scheduledStartTime || new Date()}
        hostInfo={hostInfo || {}}
      />
    </div>
  );
}
