import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import RecordingPlayer from '../components/RecordingPlayer';
import ConfirmDialog from '../components/ConfirmDialog';
import MessageBanner from '../components/MessageBanner';
import 'C:/Users/abdul/Desktop/class/frontend/src/styles/RecordingsPage.css';

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [filter, setFilter] = useState('all');
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const response = await api.get('/recordings/list/all');
      setRecordings(response.data);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRecording = (recordingId) => {
    setConfirm({
      open: true,
      title: 'Delete Recording',
      message: 'Are you sure you want to delete this recording?',
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await api.delete(`/recordings/${recordingId}`);
          fetchRecordings();
        } catch (err) {
          console.error('Failed to delete recording:', err);
          setError('Failed to delete recording');
        }
      },
    });
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
    return <div className="loading">Loading recordings...</div>;
  }

  const filteredRecordings = filter === 'all' 
    ? recordings 
    : recordings.filter(r => r.status === filter);

  return (
    <div className="recordings-page">
      {error && (
        <MessageBanner type="error" title="Recordings" message={error} onClose={() => setError(null)} />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />
      <div className="container">
        <div className="page-header">
          <h1>My Recordings</h1>
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
                  <p className="class-name">{recording.className}</p>
                  <div className="recording-meta">
                    <span>⏱ {Math.floor(recording.duration / 60)} min</span>
                    <span>📅 {new Date(recording.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="ai-features">
                    {recording.transcript && <span className="feature-badge">📝 Transcript</span>}
                    {recording.summary && <span className="feature-badge">📋 Summary</span>}
                    {recording.chapters && recording.chapters.length > 0 && (
                      <span className="feature-badge">📑 {recording.chapters.length} Chapters</span>
                    )}
                  </div>

                  <div className="recording-actions">
                    <button
                      onClick={() => setSelectedRecording(recording._id)}
                      className="btn btn-primary"
                    >
                      Watch
                    </button>
                    <button
                      onClick={() => deleteRecording(recording._id)}
                      className="btn btn-danger"
                    >
                      Delete
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
