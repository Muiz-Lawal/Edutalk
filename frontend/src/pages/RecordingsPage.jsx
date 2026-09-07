import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import RecordingPlayer from '../components/RecordingPlayer';
import '../styles/RecordingsPage.css';

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await api.get('/recordings/library');
      setRecordings(response.data.recordings || []);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = async (recordingId) => {
    if (window.confirm('Are you sure you want to delete this recording?')) {
      try {
        await api.delete(`/recordings/${recordingId}`);
        fetchRecordings();
      } catch (error) {
        console.error('Failed to delete recording:', error);
      }
    }
  };

  if (selectedRecording) {
    return (
      <div className="recordings-page">
        <button onClick={() => setSelectedRecording(null)} className="btn btn-secondary back-btn">
          ← Back to Recordings
        </button>
        <RecordingPlayer recordingId={selectedRecording} />
      </div>
    );
  }

  if (loading) {
    return <div className="async-skeleton async-skeleton--list" aria-hidden="true" />;
  }

  const filteredRecordings = filter === 'all' 
    ? recordings 
    : recordings.filter(r => r.status === filter);

  return (
    <div className="recordings-page">
      <div className="container">
        <div className="page-header">
          <h1>Session recordings</h1>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({recordings.length})
            </button>
            <button
              className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
              onClick={() => setFilter('processing')}
            >
              Processing
            </button>
            <button
              className={`filter-btn ${filter === 'ready' ? 'active' : ''}`}
              onClick={() => setFilter('ready')}
            >
              Ready
            </button>
            <button
              className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
              onClick={() => setFilter('archived')}
            >
              Archived
            </button>
          </div>
        </div>

        {filteredRecordings.length > 0 ? (
          <div className="recordings-grid">
            {filteredRecordings.map((recording) => (
              <div key={recording._id} className="recording-card">
                <div className="recording-thumbnail">
                  <div className="play-icon">▶</div>
                  <div className="status-badge">{recording.status}</div>
                </div>

                <div className="recording-info">
                  <h3>{recording.title}</h3>
                  <p className="class-name">{recording.classId?.title || 'Class session'}</p>
                  <div className="recording-meta">
                    <span>{Math.floor((recording.durationSeconds || 0) / 60)} min</span>
                    <span>{recording.status === 'processing' ? 'Recording processing — usually ready within an hour' : recording.releaseAt && new Date(recording.releaseAt) > new Date() ? 'Pending host release' : 'Available'}</span>
                  </div>

                  <div className="ai-features">
                    {recording.transcript && <span className="feature-badge">Transcript</span>}
                    {recording.aiSummary && <span className="feature-badge">Summary</span>}
                    {recording.aiTimestamps && recording.aiTimestamps.length > 0 && (
                      <span className="feature-badge">{recording.aiTimestamps.length} chapters</span>
                    )}
                  </div>

                  <div className="recording-actions">
                    <button
                      disabled={recording.subscriptionStatus === 'expired' || recording.status !== 'ready' || !recording.isVisible}
                      className="btn btn-primary"
                    >
                      {recording.subscriptionStatus === 'expired' ? 'Renew to watch' : recording.status === 'ready' && recording.isVisible ? 'Watch' : 'Processing'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-recordings">
            <p>🎥 No recordings found</p>
          </div>
        )}
      </div>
    </div>
  );
}
