import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import '../styles/Dashboard.css';
import { BarChart3, CalendarDays, ClipboardList, Play, Plus, Settings } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import { Field, Input } from '../components/ui/Field';
import AsyncBoundary from '../components/AsyncBoundary';

export default function HostDashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [classes, setClasses] = useState([]);
  const [starterClass, setStarterClass] = useState(null);
  const [externalMeetingUrl, setExternalMeetingUrl] = useState('');
  const [savedMeetingUrl, setSavedMeetingUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user?.isHost) return;
    api.get('/classes/my-classes')
      .then(({ data }) => setClasses(Array.isArray(data) ? data : []))
      .catch((error) => console.error('Failed to fetch host classes:', error));
  }, [isAuthenticated, user?.isHost]);

  if (loading) return <main className="dashboard-page"><div className="container"><AsyncBoundary loading loadingVariant="block" /></div></main>;
  if (!isAuthenticated || !user?.isHost) return <Navigate to="/login" replace />;

  const isStarter = (user.planTier || 'starter').toLowerCase() === 'starter';
  const startLive = (classId) => {
    if (isStarter) {
      setStarterClass(classId);
      setExternalMeetingUrl('');
    } else {
      navigate(`/go-live/${classId}`);
    }
  };
  const submitExternalRoom = (event) => {
    event.preventDefault();
    try {
      const url = new URL(externalMeetingUrl);
      if (url.protocol !== 'https:') throw new Error('invalid');
      localStorage.setItem(`edutalk:meeting:${starterClass}`, externalMeetingUrl);
      setSavedMeetingUrl(externalMeetingUrl);
      setStarterClass(null);
    } catch {
      setExternalMeetingUrl('');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <header className="page-header">
          <div><p className="eyebrow">Creator workspace</p><h1>Host Dashboard</h1><p className="page-subtitle">Manage classes, connect with learners, and track your impact.</p></div>
          <Link to="/host/classes/new" className="ui-button ui-button--primary ui-button--md"><Plus size={16} /> Create a class</Link>
        </header>

        <div className="host-stats dashboard-stats">
          <StatCard label="Total classes" value={classes.length} />
          <StatCard label="Active students" value={user.totalActiveStudents || 0} />
          <StatCard label="Plan tier" value={<span className="plan-badge">{(user.planTier || 'starter').toUpperCase()}</span>} />
          <StatCard label="Average rating" value={user.averageRating != null ? user.averageRating.toFixed(1) : '—'} />
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card dashboard-card--primary">
            <div className="section-heading"><h2>My classes</h2></div>
            {classes.length ? (
              <div className="class-list">
                {classes.map((classItem, index) => (
                  <article key={classItem._id} className="class-item">
                    <div className="class-item__main">
                      {classItem.thumbnailImage ? <img className="class-thumbnail" src={classItem.thumbnailImage} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <div className="class-thumbnail-fallback">{classItem.title?.charAt(0)?.toUpperCase() || 'C'}</div>}
                      <div className="class-item__details">
                        <div className="class-item__title-row"><h4>{classItem.title}</h4><span className="class-category-badge">{classItem.category || 'Class'}</span></div>
                        <p className="class-status">{classItem.durationType === 'fixed' ? `Fixed · starts ${classItem.startDate ? new Date(classItem.startDate).toLocaleDateString() : 'soon'}` : 'Ongoing · join anytime'}</p>
                      </div>
                    </div>
                    <div className="class-live-action">
                      <button type="button" onClick={() => startLive(classItem._id)} className="btn btn-primary btn-sm"><Play size={15} /> Go live</button>
                      <Link to={`/host/classes/${classItem._id}`} className="btn btn-ghost btn-sm"><Settings size={15} /> Manage settings</Link>
                    </div>
                    {isStarter && index === 0 && <small className="go-live-hint">Built-in video unlocks at Growth (23 active paying students).</small>}
                  </article>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty-state"><div className="class-thumbnail-fallback"><Plus size={20} /></div><h3>No classes yet</h3><p>Create your first class to start teaching.</p><Link to="/host/classes/new" className="ui-button ui-button--primary ui-button--md"><Plus size={16} /> Create a class</Link></div>
            )}
          </section>

          <aside className="dashboard-sidebar">
            <section className="dashboard-card quick-stats-card">
              <h2>Quick stats</h2>
              <div className="quick-stats">
                <div className="quick-stat"><span className="label">Total revenue</span><span className="value">$0.00</span></div>
                <div className="quick-stat"><span className="label">Free admission slots</span><span className="value">{user.freeAdmissionSlots || 0}</span></div>
                <div className="quick-stat"><span className="label">Students this month</span><span className="value">0</span></div>
              </div>
            </section>
            <section className="dashboard-card quick-actions-card">
              <h2>Quick actions</h2>
              <div className="quick-actions-grid">
                <Link to="/analytics" className="btn btn-secondary"><BarChart3 size={16} /> Analytics</Link>
                <Link to="/schedules" className="btn btn-secondary"><CalendarDays size={16} /> Schedules</Link>
                <Link to="/appeals" className="btn btn-secondary"><ClipboardList size={16} /> Appeals</Link>
              </div>
            </section>
          </aside>
        </div>

        {starterClass && <Modal open title="Use an external meeting room" onClose={() => setStarterClass(null)}>
          <p>Starter hosts can go live with a secure Zoom or Google Meet link.</p>
          <form onSubmit={submitExternalRoom}><Field label="Zoom/Meet URL"><Input autoFocus type="url" required pattern="https://.*" value={externalMeetingUrl} onChange={(event) => setExternalMeetingUrl(event.target.value)} placeholder="https://..." /></Field><div className="quick-actions-grid"><Button type="button" variant="secondary" onClick={() => setStarterClass(null)}>Cancel</Button><Button type="submit">Start session</Button></div></form>
        </Modal>}
        {savedMeetingUrl && <Modal open title="Meeting link saved" onClose={() => setSavedMeetingUrl('')}><p>Your external meeting link is ready for this session.</p><div className="quick-actions-grid"><Button type="button" variant="secondary" onClick={() => setSavedMeetingUrl('')}>Close</Button><a className="btn btn-primary" href={savedMeetingUrl} target="_blank" rel="noreferrer">Open meeting</a></div></Modal>}
      </div>
    </div>
  );
}
