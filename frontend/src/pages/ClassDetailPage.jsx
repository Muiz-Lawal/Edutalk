import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import useEventLogger from '../hooks/useEventLogger';
import { formatInTimeZone } from 'date-fns-tz';
import { getClassStatus } from '../lib/classStatus';
import { getEnrollmentDayLimits, getSessionsInAccessWindow, formatSessionSummary } from '../lib/sessions';
import { useCartStore } from '../stores/cartStore';
import { showToast } from '../utils/toastManager';
import '../styles/ClassDetail.css';
import { Skeleton } from '../components/AsyncBoundary';
import { CalendarDays, LockKeyhole, Play } from 'lucide-react';
import RecordingPlayer from '../components/RecordingPlayer';

export default function ClassDetailPage() {
  const { classId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDays, setSelectedDays] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [classRecordings, setClassRecordings] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRecording, setSelectedRecording] = useState(null);
  const addLine = useCartStore((state) => state.addLine);

  useEffect(() => {
    fetchClass();
  }, [classId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/recordings/library').then(({ data }) => {
      setClassRecordings((data.recordings || []).filter((recording) => String(recording.classId?._id || recording.classId) === String(classId)));
    }).catch(() => setClassRecordings([]));
  }, [classId, isAuthenticated]);

  // Log that user viewed this class
  const { logEvent } = useEventLogger();
  useEffect(() => {
    if (classData) {
      logEvent({ action: 'view_class', targetType: 'class', targetId: classData._id });
    }
  }, [classData]);

  const fetchClass = async () => {
    try {
      setLoading(true);
      setError(false);
      const response = await api.get(`/classes/${classId}`);
      setClassData(response.data);
    } catch (error) {
      console.error('Failed to fetch class:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Redirect to payment flow
      navigate(`/class/${classId}/enroll?days=${selectedDays}`);
    }
  };

  const handleAddToCart = () => {
    addLine(classData, safeDays);
    showToast({ type: 'success', title: 'Added to cart', message: `${classData.title} is ready for multi-class checkout.` });
  };

  if (loading) {
    return <Skeleton variant="block" />;
  }

  if (error || !classData) {
    return <div className="async-state async-state--error" role="alert"><strong>We couldn’t load this class</strong><p>Please try again.</p><button type="button" onClick={fetchClass}>Retry</button></div>;
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const limits = getEnrollmentDayLimits(classData);
  const safeDays = limits.max > 0 ? Math.min(Math.max(selectedDays, limits.min), limits.max) : limits.min;
  const sessions = Array.isArray(classData.sessions) ? classData.sessions : [];
  const previewSessions = getSessionsInAccessWindow(sessions, new Date(), safeDays);
  const appearance = classData.appearance || {};
  const accentColor = appearance.accentColor || '#4F46E5';
  const heroImage = appearance.bannerImage || appearance.thumbnailImage || classData.thumbnailImage;
  const heroPlaceholder = appearance.bannerLqip || appearance.thumbnailImage || classData.thumbnailImage;
  const gallery = Array.isArray(appearance.gallery) ? appearance.gallery : [];

  return (
    <div className="class-detail-page" style={{ '--class-accent': accentColor }}>
      <div className="container">
        <div className="class-header class-header--hero" style={heroImage ? { backgroundImage: `linear-gradient(rgba(15,23,42,.7), rgba(15,23,42,.7)), url("${heroImage}")`, '--hero-placeholder': `url("${heroPlaceholder}")` } : undefined}>
          <h1>{classData.title}</h1>
          <p className="host-info">{appearance.hostLogo && <img className="class-host-logo" src={appearance.hostLogo} alt="" loading="lazy" />} by {classData.hostId?.firstName} {classData.hostId?.lastName}</p>
          <p className="class-status">{getClassStatus(classData, new Date(), timezone)}</p>
        </div>
        {classRecordings.length > 0 && <nav className="class-tabs" aria-label="Class sections">
          <button type="button" className={activeTab === 'overview' ? 'is-active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
          <button type="button" className={activeTab === 'recordings' ? 'is-active' : ''} onClick={() => setActiveTab('recordings')}>Recordings <span>{classRecordings.length}</span></button>
        </nav>}

        <div className={`class-content ${activeTab === 'recordings' ? 'class-content--recordings' : ''}`}>
          {activeTab === 'recordings' ? <section className="section class-recordings" aria-labelledby="class-recordings-title">
            <h2 id="class-recordings-title">Class recordings</h2>
            <p className="section-intro">Recordings are available only during your paid access period and stream securely without downloads.</p>
            <div className="class-recordings__grid">{classRecordings.map((recording) => {
              const available = recording.isPlayable || (recording.status === 'ready' && recording.isVisible && !recording.isLocked);
              const locked = recording.subscriptionStatus === 'expired' || recording.subscriptionStatus === 'cancelled';
              return <article className="class-recording-card" key={recording.id || recording._id}>
                <div className="class-recording-card__visual"><Play size={24} />{!available && <div className="class-recording-card__lock"><LockKeyhole size={18} /><strong>{locked ? 'Access ended' : 'Not available yet'}</strong></div>}</div>
                <div><h3>{recording.title || 'Class recording'}</h3><p><CalendarDays size={14} /> {recording.createdAt ? new Date(recording.createdAt).toLocaleDateString() : 'Date not provided'}</p>
                  {locked && <p className="class-recording-card__notice">Active enrollment includes recordings from live sessions.</p>}
                  {!locked && !available && <p className="class-recording-card__notice">{recording.status === 'review_hold' ? `In review — available ${recording.reviewHoldUntil ? new Date(recording.reviewHoldUntil).toLocaleString() : 'after review'}.` : 'Your host is still preparing this recording.'}</p>}
                  <button type="button" className="btn btn-primary" disabled={!available} onClick={() => setSelectedRecording(recording)}>{available ? 'Watch recording' : locked ? 'Re-enrol to watch' : 'Not available yet'}</button>
                </div>
              </article>;
            })}</div>
          </section> : <>
          <div className="class-main">
            <div className="class-intro">
              {classData.thumbnailImage ? (
                <img src={classData.thumbnailImage} alt={classData.title} loading="lazy" />
              ) : (
                <div className="placeholder">📚</div>
              )}
            </div>

            <section className="section">
              <h2>About This Class</h2>
              <p>{classData.description}</p>
            </section>

            {gallery.length > 0 && <section className="section"><h2>Gallery</h2><div className="class-gallery">{gallery.map((image, index) => <button className="class-gallery__item" type="button" key={`${image.url}-${index}`} onClick={() => setLightboxIndex(index)}><img src={image.url} alt={image.caption || `${classData.title} gallery image ${index + 1}`} loading="lazy" /><span>{image.caption}</span></button>)}</div></section>}

            <section className="section">
              <h2>Schedule</h2>
              <div className="schedule-info">
                {classData.schedule && classData.schedule.length > 0 ? (
                  <ul>
                    {classData.schedule.map((session, idx) => (
                      <li key={idx}>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session.dayOfWeek]} at {session.startTime}
                        ({session.durationMinutes || session.duration || 60} minutes)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Schedule to be announced</p>
                )}
              </div>
            </section>

            <section className="section">
              <h2>Sessions ({classData.sessions?.length || 0})</h2>
              <div className="sessions-list">
                {sessions.length > 0 ? (
                  sessions.slice(0, 5).map((session) => (
                    <div key={session._id} className="session-item">
                      <span className="session-date">
                        {formatInTimeZone(session.scheduledStartTime, timezone, 'MMM d, yyyy')}
                      </span>
                      <span className="session-time">
                        {formatInTimeZone(session.scheduledStartTime, timezone, 'h:mm a')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No sessions scheduled yet</p>
                )}
              </div>
            </section>

            <section className="section">
              <h2>Category & Tags</h2>
              <div className="tags">
                {classData.category && <span className="tag category">{classData.category}</span>}
                {classData.tags?.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <aside className="class-sidebar">
            <div className="enrollment-card">
              <div className="price-info">
                <h3>Pricing</h3>
                <p className="monthly-price">${classData.monthlyPrice}/month</p>
                <p className="daily-rate">Starting from ${(classData.monthlyPrice / 30).toFixed(2)}/day</p>
              </div>

              <div className="days-selector">
                <label>Select Duration</label>
                <input
                  type="range"
                  min={limits.min}
                  max={limits.max}
                  value={safeDays}
                  disabled={limits.endingSoon}
                  onChange={(e) => setSelectedDays(parseInt(e.target.value, 10))}
                />
                <p className="days-display">{limits.endingSoon ? 'This class is ending soon' : `${safeDays} days selected (minimum ${limits.min}, maximum ${limits.max})`}</p>
                {!limits.endingSoon && <p className="session-preview">You&apos;ll get {previewSessions.length} sessions{previewSessions.length ? `: ${formatSessionSummary(previewSessions, timezone)}` : '.'}</p>}
              </div>

              <div className="price-calculation">
                <p>
                  <strong>Total Price:</strong> $
                  {(
                    (classData.monthlyPrice / 30) *
                    (safeDays <= 3 ? 1.8 : safeDays <= 6 ? 1.5 : safeDays <= 13 ? 1.25 : safeDays <= 20 ? 1.1 : 1) *
                    safeDays
                  ).toFixed(2)}
                </p>
              </div>

              <button className="btn btn-primary" style={{ backgroundColor: accentColor }} disabled={limits.endingSoon} onClick={() => {
                logEvent({ action: 'click_enroll', targetType: 'class', targetId: classData._id });
                if (isAuthenticated) handleAddToCart();
                else navigate('/login');
              }}>
                {isAuthenticated ? 'Add to cart' : 'Sign in to Enroll'}
              </button>

              <div className="class-stats">
                <div className="stat">
                  <span className="label">Students</span>
                  <span className="value">{classData.totalEnrolled}</span>
                </div>

                <div className="stat">
                  <span className="label">Rating</span>
                  <span className="value">{classData.averageRating != null ? classData.averageRating.toFixed(1) : '—'}</span>
                </div>
                {lightboxIndex !== null && gallery[lightboxIndex] && <div className="class-lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxIndex(null)}><button type="button" aria-label="Close image" onClick={() => setLightboxIndex(null)}>Close</button><img src={gallery[lightboxIndex].url} alt={gallery[lightboxIndex].caption || classData.title} onClick={(event) => event.stopPropagation()} /><button type="button" aria-label="Previous image" onClick={(event) => { event.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + gallery.length) % gallery.length); }}>Previous</button><button type="button" aria-label="Next image" onClick={(event) => { event.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % gallery.length); }}>Next</button></div>}
              </div>
            </div>
          </aside>
          </>}
        </div>
      </div>
      {selectedRecording && <div className="recording-modal" role="dialog" aria-modal="true" aria-label="Recording player"><RecordingPlayer recordingId={selectedRecording.id || selectedRecording._id} onClose={() => setSelectedRecording(null)} /></div>}
    </div>
  );
}
