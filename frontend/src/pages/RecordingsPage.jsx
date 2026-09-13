import React, { useEffect, useState } from 'react';
import { CalendarDays, Clock3, LockKeyhole, Play, Radio, Users } from 'lucide-react';
import RecordingPlayer from '../components/RecordingPlayer';
import api from '../utils/api';
import '../styles/RecordingsPage.css';

const dateLabel = (recording) => {
  const date = recording.sessionDate || recording.createdAt || recording.releaseAt;
  return date ? new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Date not provided';
};

function RecordingCard({ recording, onWatch }) {
  const available = recording.isPlayable || (recording.status === 'ready' && recording.isVisible && !recording.isLocked);
  const locked = recording.subscriptionStatus === 'expired' || recording.subscriptionStatus === 'cancelled';
  return (
    <article className={`recording-card ${!available ? 'recording-card--unavailable' : ''}`}>
      <div className="recording-thumbnail"><Radio size={28} aria-hidden="true" /><span className="status-badge">{available ? 'Available' : recording.status === 'processing' ? 'Preparing' : 'Not available'}</span>{locked && <div className="recording-lock"><LockKeyhole size={22} /><span>Re-enrol to watch</span></div>}</div>
      <div className="recording-info">
        <h3>{recording.title || 'Class recording'}</h3>
        <p className="class-name">{recording.classTitle || recording.classId?.title || 'Your class'}</p>
        <div className="recording-meta"><span><Users size={14} /> {recording.hostName || recording.hostId?.name || 'Your host'}</span><span><CalendarDays size={14} /> {dateLabel(recording)}</span><span><Clock3 size={14} /> {Math.round((recording.durationSeconds || 0) / 60)} min</span></div>
        {!available && <p className="recording-honesty">{locked ? 'Active enrollment includes recordings from live sessions.' : recording.status === 'review_hold' ? `In review — available ${recording.reviewHoldUntil ? new Date(recording.reviewHoldUntil).toLocaleString() : 'after review'}.` : 'This recording is still being prepared.'}</p>}
        <button type="button" className="btn btn-primary" disabled={!available} onClick={() => onWatch(recording)}><Play size={16} /> {available ? 'Watch recording' : locked ? 'Re-enrol to watch' : 'Not available yet'}</button>
      </div>
    </article>
  );
}

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    api.get('/recordings/library').then(({ data }) => setRecordings(data.recordings || [])).catch(() => setError('We could not load your recordings. Please try again.')).finally(() => setLoading(false));
  }, []);
  if (loading) return <div className="recordings-page"><div className="container"><div className="recordings-skeleton" aria-label="Loading recordings" /></div></div>;
  if (selected) return <div className="recordings-page"><div className="container"><RecordingPlayer recordingId={selected.id || selected._id} onClose={() => setSelected(null)} /></div></div>;
  const fromClasses = recordings.filter((item) => !item.libraryShared);
  const shared = recordings.filter((item) => item.libraryShared);
  const section = (title, items, description) => <section className="recordings-section"><div className="section-heading"><div><p className="eyebrow">{title}</p><h2>{description}</h2></div><span className="section-count">{items.length}</span></div>{items.length ? <div className="recordings-grid">{items.map((recording) => <RecordingCard key={recording.id || recording._id} recording={recording} onWatch={setSelected} />)}</div> : <div className="recordings-empty"><Radio size={22} /><p>{title === 'From your classes' ? 'Recordings from your enrolled classes will appear here.' : 'Your hosts have not shared any recordings with you yet.'}</p></div>}</section>;
  return <div className="recordings-page"><div className="container"><header className="recordings-header"><div><p className="eyebrow">Library</p><h1>Your recordings</h1><p>Watch secure class sessions shared with you. Recordings stream only and cannot be downloaded.</p></div></header>{error && <div className="async-state async-state--error" role="alert">{error}</div>}{section('From your classes', fromClasses, 'Your enrolled class sessions')}{section('Shared by your hosts', shared, 'Recordings shared with you')}</div></div>;
}
