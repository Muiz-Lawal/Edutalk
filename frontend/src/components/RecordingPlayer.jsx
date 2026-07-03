import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/RecordingPlayer.css';

export default function RecordingPlayer({ recordingId }) {
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [chapters, setChapters] = useState([]);
  const videoRef = React.useRef(null);

  useEffect(() => {
    fetchRecording();
  }, [recordingId]);

  const fetchRecording = async () => {
    try {
      const response = await api.get(`/recordings/${recordingId}`);
      setRecording(response.data);
      setChapters(response.data.chapters || []);
    } catch (error) {
      console.error('Failed to fetch recording:', error);
    } finally {
      setLoading(false);
    }
  };

  const jumpToChapter = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  if (loading) {
    return <div className="loading">Loading recording...</div>;
  }

  if (!recording) {
    return <div className="error">Recording not found</div>;
  }

  return (
    <div className="recording-player">
      <div className="player-main">
        <div className="video-wrapper">
          <video
            ref={videoRef}
            src={recording.hlsUrl || recording.storageUrl}
            controls
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            className="video-player"
          />
          <div className="watermark">📧 {recording.watermarkText}</div>
        </div>

        <div className="video-info">
          <h2>{recording.title}</h2>
          <p>{recording.description}</p>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Duration:</span>
              <span className="value">{Math.floor(recording.duration / 60)} minutes</span>
            </div>
            <div className="info-item">
              <span className="label">File Size:</span>
              <span className="value">{(recording.fileSize / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">{recording.status}</span>
            </div>
          </div>
        </div>
      </div>

      <aside className="player-sidebar">
        <div className="sidebar-section">
          <h3>Transcript</h3>
          <div className="transcript">
            {recording.transcript ? (
              <p>{recording.transcript.substring(0, 500)}...</p>
            ) : (
              <p className="placeholder">Transcription processing...</p>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Summary</h3>
          <div className="summary">
            {recording.summary ? (
              <p>{recording.summary}</p>
            ) : (
              <p className="placeholder">Summary generating...</p>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Key Takeaways</h3>
          <ul className="takeaways">
            {recording.keyTakeaways && recording.keyTakeaways.length > 0 ? (
              recording.keyTakeaways.map((takeaway, idx) => (
                <li key={idx}>{takeaway}</li>
              ))
            ) : (
              <li className="placeholder">Extracting key points...</li>
            )}
          </ul>
        </div>

        {chapters.length > 0 && (
          <div className="sidebar-section">
            <h3>Chapters</h3>
            <div className="chapters-list">
              {chapters.map((chapter, idx) => (
                <button
                  key={idx}
                  className="chapter-btn"
                  onClick={() => jumpToChapter(chapter.timestamp)}
                >
                  <span className="time">
                    {Math.floor(chapter.timestamp / 60)}:{String(chapter.timestamp % 60).padStart(2, '0')}
                  </span>
                  <span className="title">{chapter.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
