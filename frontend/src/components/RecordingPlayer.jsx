import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Maximize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';
import api from '../utils/api';
import '../styles/RecordingPlayer.css';

const fingerprint = () => localStorage.getItem('edutalk:device-fingerprint') || '';

export default function RecordingPlayer({ recordingId, onClose }) {
  const videoRef = useRef(null);
  const [recording, setRecording] = useState(null);
  const [playback, setPlayback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [watermarkIndex, setWatermarkIndex] = useState(0);
  const retryRef = useRef(false);

  const openPlayback = useCallback(async (retry = false) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post(`/recordings/${recordingId}/play`, {}, {
        headers: { 'X-Device-Fingerprint': fingerprint() },
      });
      retryRef.current = retry;
      setPlayback(data);
    } catch (err) {
      const response = err.response;
      const code = response?.data?.code;
      const message = response?.data?.message;
      setError(code === 'subscription_required' || code === 'subscription_expired'
        ? 'Your class access has ended. Re-enrol to keep watching this recording.'
        : code === 'recording_locked' ? 'This recording is not available yet.'
          : message || 'We could not start this recording. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [recordingId]);

  useEffect(() => {
    let cancelled = false;
    openPlayback();
    api.get(`/recordings/${recordingId}`).then(({ data }) => {
      if (!cancelled) setRecording(data.data || data);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [recordingId, openPlayback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playback?.streamUrl) return undefined;
    let hls;
    const handleError = () => {
      if (!retryRef.current) openPlayback(true);
      else setError('This playback session expired — press play to resume.');
    };
    video.addEventListener('error', handleError);
    if (video.canPlayType('application/vnd.apple.mpegurl')) video.src = playback.streamUrl;
    else if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(playback.streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) handleError(); });
    }
    return () => { video.removeEventListener('error', handleError); hls?.destroy(); };
  }, [playback, openPlayback]);

  useEffect(() => {
    if (!playback?.watermark?.positions?.length) return undefined;
    const timer = setInterval(() => setWatermarkIndex((index) => (index + 1) % playback.watermark.positions.length), (playback.watermark.intervalSeconds || 20) * 1000);
    return () => clearInterval(timer);
  }, [playback]);

  const video = videoRef.current;
  const togglePlay = () => {
    if (!video) return;
    if (video.paused) video.play().catch(() => {}); else video.pause();
  };
  const seek = (event) => { if (video) video.currentTime = (Number(event.target.value) / 100) * (video.duration || 0); };
  const updateProgress = () => {
    if (!video) return;
    setProgress(video.duration ? (video.currentTime / video.duration) * 100 : 0);
    if (video.duration) api.post(`/recordings/${recordingId}/progress`, { position: video.currentTime, percentWatched: (video.currentTime / video.duration) * 100 }).catch(() => {});
  };
  const changePlaybackRate = (event) => {
    const nextRate = Number(event.target.value);
    setPlaybackRate(nextRate);
    if (video) video.playbackRate = nextRate;
  };

  if (loading) return <div className="recording-player-state"><div className="async-skeleton async-skeleton--block" /><p>Preparing secure playback…</p></div>;
  if (error) return <div className="recording-player-state recording-player-state--error"><strong>Playback unavailable</strong><p>{error}</p><button type="button" className="btn btn-secondary" onClick={() => openPlayback()}><RotateCcw size={16} /> Try again</button>{onClose && <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>}</div>;

  const watermark = playback?.watermark;
  const watermarkText = [watermark?.name, watermark?.email].filter(Boolean).join(' · ');
  return (
    <div className="recording-player" onContextMenu={(event) => event.preventDefault()}>
      {onClose && <button type="button" className="recording-player__close btn btn-ghost" onClick={onClose}>Close</button>}
      <div className="player-main">
        <div className="video-wrapper">
          <video ref={videoRef} className="video-player" playsInline disablePictureInPicture
            onLoadedMetadata={(event) => { if (playback.resumePosition) event.currentTarget.currentTime = playback.resumePosition; }}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={updateProgress} />
          {watermark?.overlayEnabled !== false && <div className={`watermark watermark-position-${watermarkIndex}`} aria-hidden="true">{watermarkText}</div>}
          <div className="video-controls">
            <button type="button" aria-label={playing ? 'Pause' : 'Play'} onClick={togglePlay}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
            <input aria-label="Seek recording" type="range" min="0" max="100" value={progress} onChange={seek} />
            <button type="button" aria-label={muted ? 'Unmute' : 'Mute'} onClick={() => { setMuted(!muted); if (video) video.muted = !muted; }}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <select aria-label="Playback speed" value={playbackRate} onChange={changePlaybackRate}>
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}x</option>)}
            </select>
            <button type="button" aria-label="Fullscreen" onClick={() => video?.requestFullscreen?.()}><Maximize size={18} /></button>
          </div>
        </div>
        <div className="video-info">
          <p className="eyebrow">Recording</p>
          <h2>{recording?.title || 'Class recording'}</h2>
          {recording?.description && <p>{recording.description}</p>}
          <div className="info-grid"><div><span className="label">Duration</span><span className="value">{Math.floor((recording?.durationSeconds || 0) / 60)} min</span></div><div><span className="label">Access</span><span className="value">Streaming only</span></div><div><span className="label">Status</span><span className="value">Available</span></div></div>
        </div>
      </div>
      <aside className="player-sidebar">
        <div className="sidebar-section"><h3>Transcript</h3><p>{recording?.transcript || 'Transcript is not available for this recording.'}</p></div>
        <div className="sidebar-section"><h3>Summary</h3><p>{recording?.aiSummary || 'Summary is not available for this recording.'}</p></div>
        {recording?.aiKeyTakeaways?.length > 0 && <div className="sidebar-section"><h3>Key takeaways</h3><ul>{recording.aiKeyTakeaways.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
      </aside>
    </div>
  );
}
