import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import api from '../utils/api';
import '../styles/RecordingPlayer.css';

export default function RecordingPlayer({ recordingId }) {
  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(null);
  const [watermarkIndex, setWatermarkIndex] = useState(0);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.post(`/recordings/play/${recordingId}`, {}, {
      headers: { 'X-Device-Fingerprint': localStorage.getItem('edutalk:device-fingerprint') || '' },
    }).then(({ data }) => {
      if (!cancelled) setPlayback(data);
    }).catch((requestError) => {
      if (!cancelled) setError(requestError.response?.data?.message || 'Unable to start secure playback.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    api.get(`/recordings/${recordingId}`).then(({ data }) => {
      if (!cancelled) setRecording(data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [recordingId]);

  useEffect(() => {
    if (!playback?.streamUrl || !videoRef.current) return undefined;
    const video = videoRef.current;
    let hls;
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = playback.streamUrl;
    else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(playback.streamUrl);
      hls.attachMedia(video);
    }
    return () => hls?.destroy();
  }, [playback]);

  useEffect(() => {
    if (!playback?.watermark?.positions?.length) return undefined;
    const timer = window.setInterval(() => setWatermarkIndex((index) => (index + 1) % playback.watermark.positions.length), (playback.watermark.intervalSeconds || 20) * 1000);
    return () => window.clearInterval(timer);
  }, [playback]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!videoRef.current || ['INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (event.key === ' ') {
        event.preventDefault();
        videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
      } else if (event.key === 'ArrowLeft') {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      } else if (event.key === 'ArrowRight') {
        videoRef.current.currentTime += 5;
      } else if (event.key.toLowerCase() === 'j') {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
      } else if (event.key.toLowerCase() === 'l') {
        videoRef.current.currentTime += 10;
      } else if (event.key.toLowerCase() === 'f') {
        videoRef.current.requestFullscreen?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const jumpToChapter = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const chapters = (recording?.aiTimestamps || []).map((chapter) => ({
    timestamp: Number(chapter.timestamp ?? chapter.t ?? 0),
    title: chapter.title || chapter.label || 'Chapter',
  }));

  const transcriptSegments = recording?.transcriptSegments || [];
  const matchingSegments = transcriptSearch
    ? transcriptSegments.filter((segment) => segment.text?.toLowerCase().includes(transcriptSearch.toLowerCase()))
    : [];

  if (loading) {
    return <div className="async-skeleton async-skeleton--block" aria-hidden="true" />;
  }

  if (error) {
    return <div className="error">{error.includes('Renew') ? <><p>{error}</p><a href="/dashboard">Renew to keep watching</a></> : error}</div>;
  }

  return (
    <div className="recording-player">
      <div className="player-main">
        <div className="video-wrapper" onContextMenu={(event) => event.preventDefault()}>
          <video
            ref={videoRef}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onLoadedMetadata={(event) => {
              if (playback.resumePosition) event.currentTarget.currentTime = playback.resumePosition;
            }}
            onTimeUpdate={(event) => {
              const duration = event.currentTarget.duration || 0;
              if (duration) api.post(`/recordings/${recordingId}/progress`, { position: event.currentTarget.currentTime, percentWatched: (event.currentTarget.currentTime / duration) * 100 }).catch(() => {});
            }}
            className="video-player"
          />
          <div className={`watermark watermark--email watermark-position-${watermarkIndex}`}>{playback.watermark.email}</div>
        </div>

        <div className="video-info">
          <h2>{recording?.title || 'Session recording'}</h2>
          <p>{recording?.description}</p>
          
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Duration:</span>
              <span className="value">{Math.floor((recording?.durationSeconds || 0) / 60)} minutes</span>
            </div>
            <div className="info-item">
              <span className="label">File Size:</span>
              <span className="value">Streaming only</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value">{recording?.status}</span>
            </div>
          </div>
        </div>
      </div>

      <aside className="player-sidebar">
        <div className="sidebar-section">
          <h3>Transcript</h3>
          {recording?.transcript && (
            <input
              type="search"
              value={transcriptSearch}
              onChange={(event) => setTranscriptSearch(event.target.value)}
              placeholder="Search transcript"
              aria-label="Search transcript"
            />
          )}
          <div className="transcript">
            {recording?.transcript ? (
            <>
              <p>{transcriptSearch
                ? recording.transcript.split(/(\s+)/).map((part, index) => (
                  part.toLowerCase().includes(transcriptSearch.toLowerCase())
                    ? <mark key={index}>{part}</mark>
                    : part
                ))
                : recording.transcript}</p>
              {matchingSegments.length > 0 && (
                <div className="transcript-matches">
                  {matchingSegments.map((segment, index) => (
                    <button key={`${segment.start}-${index}`} type="button" onClick={() => jumpToChapter(segment.start)}>
                      {Math.floor(segment.start / 60)}:{String(Math.floor(segment.start % 60)).padStart(2, '0')} — {segment.text}
                    </button>
                  ))}
                </div>
              )}
            </>
            ) : (
              <p className="placeholder">Transcription processing...</p>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Summary</h3>
          <div className="summary">
            {recording?.aiSummary ? (
              <p>{recording.aiSummary}</p>
            ) : (
              <p className="placeholder">Summary generating...</p>
            )}
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Key Takeaways</h3>
          <ul className="takeaways">
            {recording?.aiKeyTakeaways?.length > 0 ? (
              recording.aiKeyTakeaways.map((takeaway, idx) => (
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
