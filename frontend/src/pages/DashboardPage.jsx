import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';
import { BookOpen, CreditCard, Copy, Flame, Search, TrendingUp } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';
import AsyncBoundary from '../components/AsyncBoundary';
import api from '../utils/api';

export default function DashboardPage() {
  const { user, isAuthenticated, loading, activeRole } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(false);
  useEffect(() => {
    if (!isAuthenticated || activeRole === 'host') return;
    api.get('/analytics/student').then(({ data }) => setEnrollments(Array.isArray(data) ? data : [])).catch((requestError) => {
      console.error('Failed to load student dashboard', requestError);
      setDataError(true);
    }).finally(() => setDataLoading(false));
  }, [isAuthenticated, activeRole]);
  if (loading) {
    return <main className="dashboard-page"><div className="container"><AsyncBoundary loading loadingVariant="block" /></div></main>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.isAdmin || user?.adminRole) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (activeRole === 'host') {
    return <Navigate to="/host-dashboard" replace />;
  }

  return (
    <main className="dashboard-page">
      <div className="container">
        <div className="page-header">
          <div><p className="eyebrow">Your learning space</p><h1>My Learning Dashboard</h1><p className="page-subtitle">Pick up where you left off and keep your learning momentum going.</p></div>
          <Button onClick={() => navigate('/browse')}><Search size={16} /> Browse classes</Button>
        </div>
        <div className="dashboard-stats">
          <StatCard label="Enrolled classes" value={enrollments.length} />
          <StatCard label="Sessions attended" value={enrollments.reduce((total, item) => total + (item.sessionsAttended || 0), 0)} />
          <StatCard label={<><Flame size={14} /> Current streak</>} value="0 days" />
          <StatCard label="Points earned" value={user?.points || 0} />
        </div>

        <div className="dashboard-quick-links">
          <button type="button" className="dashboard-quick-link" onClick={() => navigate('/dashboard')}><BookOpen size={20} /><span><strong>My enrollments</strong><small>{enrollments.length ? `${enrollments.length} active` : 'Nothing yet'}</small></span></button>
          <button type="button" className="dashboard-quick-link" onClick={() => navigate('/payments')}><CreditCard size={20} /><span><strong>Payment history</strong><small>View receipts and payments</small></span></button>
          <button type="button" className="dashboard-quick-link" onClick={() => navigate('/progress')}><TrendingUp size={20} /><span><strong>Progress tracking</strong><small>{enrollments.length ? 'View your progress' : 'Nothing yet'}</small></span></button>
        </div>
        <section className="dashboard-enrollments">
          <div className="dashboard-section-heading"><div><h2>My enrollments</h2><p>Your active classes and upcoming sessions.</p></div></div>
          {dataError ? <AsyncBoundary error errorMessage="We couldn’t load your enrollments" onRetry={() => window.location.reload()} /> : dataLoading ? <AsyncBoundary loading loadingVariant="list" /> : enrollments.length === 0 ? <EmptyState icon={BookOpen} title="No enrollments yet" description="Explore classes from expert hosts and start building your learning path." action={{ label: 'Browse classes', onClick: () => navigate('/browse') }} /> : <div className="dashboard-enrollment-list">{enrollments.map((item) => <article className="dashboard-enrollment-row" key={item.classId}><div className="dashboard-enrollment-thumb">{item.class?.charAt(0) || 'C'}</div><div className="dashboard-enrollment-main"><h3>{item.class}</h3><p>{item.host || 'EduTalk host'}</p><div className="dashboard-progress"><span style={{ width: `${Math.min(100, item.completionPercentage || 0)}%` }} /></div><small>{item.daysRemaining} days remaining</small></div><div className="dashboard-enrollment-code"><span>{item.accessCode ? `${item.accessCode.slice(0, 3)}••••${item.accessCode.slice(-2)}` : 'ET-••••••'}</span><button type="button" aria-label="Copy access code" onClick={() => navigator.clipboard?.writeText(item.accessCode || '')}><Copy size={14} /></button></div><Button size="sm" onClick={() => navigate(`/class/${item.classId}`)}>Join next session</Button></article>)}</div>}
        </section>
      </div>
    </main>
  );
}
