import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Filter } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../utils/api';
import Button from '../components/ui/Button';
import '../styles/AnalyticsDashboard.css';

const PRESETS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

const toDateInput = (date) => date.toISOString().slice(0, 10);
const getRange = (preset) => {
  if (preset === 'all') return { from: '', to: '' };
  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - Number(preset) + 1);
  return { from: toDateInput(from), to: toDateInput(to) };
};

function SkeletonCard({ className = '' }) {
  return <div className={`analytics-skeleton ${className}`} aria-hidden="true" />;
}

export default function AnalyticsDashboard() {
  const [preset, setPreset] = useState('30');
  const [dates, setDates] = useState(getRange('30'));
  const [classId, setClassId] = useState('');
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSummary = useCallback(async (signal) => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (dates.from) params.set('from', dates.from);
      if (dates.to) params.set('to', dates.to);
      if (classId) params.set('classId', classId);
      const { data } = await api.get(`/analytics/summary?${params.toString()}`, { signal });
      setSummary(data);
    } catch (requestError) {
      if (requestError.name !== 'CanceledError' && requestError.code !== 'ERR_CANCELED') {
        setError(true);
        setSummary(null);
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [dates, classId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSummary(controller.signal);
    return () => controller.abort();
  }, [fetchSummary]);

  useEffect(() => {
    api.get('/classes/my-classes').then(({ data }) => setClasses(Array.isArray(data) ? data : data?.classes || [])).catch(() => setClasses([]));
  }, []);

  const applyPreset = (value) => {
    setPreset(value);
    if (value !== 'custom') setDates(getRange(value));
  };
  const hasDateError = Boolean(dates.from && dates.to && dates.from > dates.to);
  const applyFilters = () => {
    if (!hasDateError) fetchSummary(new AbortController().signal);
  };
  const breakdownTotal = useMemo(() => (summary?.breakdown || []).reduce((total, row) => total + row.count, 0), [summary]);
  const stats = [
    ['Total events', summary?.totalEvents],
    ['Unique users', summary?.uniqueUsers],
    ['Avg events / user', summary?.avgEventsPerUser == null ? null : summary.avgEventsPerUser.toFixed(1)],
  ];

  return (
    <main className="analytics-dashboard">
      <header className="analytics-page-header">
        <p className="analytics-eyebrow">Host tools</p>
        <h1>Analytics</h1>
        <p>Understand engagement and make every class better.</p>
      </header>

      <section className="analytics-filter-bar" aria-label="Analytics filters">
        <div className="analytics-presets" role="group" aria-label="Date range">
          {PRESETS.map((item) => <button type="button" key={item.value} className={preset === item.value ? 'is-selected' : ''} onClick={() => applyPreset(item.value)}>{item.label}</button>)}
        </div>
        {preset === 'custom' && <div className="analytics-date-fields">
          <label>From<input type="date" value={dates.from} onChange={(event) => setDates((current) => ({ ...current, from: event.target.value }))} /></label>
          <label>To<input type="date" value={dates.to} onChange={(event) => setDates((current) => ({ ...current, to: event.target.value }))} /></label>
          {hasDateError && <span className="analytics-date-error">End date must be after start date.</span>}
        </div>}
        <label className="analytics-class-select">Class
          <select value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="">All classes</option>
            {classes.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
          </select>
        </label>
        <Button onClick={applyFilters} disabled={loading || hasDateError} loading={loading}><Filter size={16} /> {loading ? 'Applying…' : 'Apply filters'}</Button>
      </section>

      {error && <div className="analytics-error" role="alert">We couldn&apos;t load your analytics.<Button variant="secondary" size="sm" onClick={applyFilters}>Retry</Button></div>}

      <section className="analytics-stat-row" aria-label="Analytics summary">
        {loading ? stats.map(([label]) => <div className="analytics-stat-card" key={label}><SkeletonCard className="analytics-skeleton-label" /><SkeletonCard className="analytics-skeleton-value" /></div>) : stats.map(([label, value]) => <article className="analytics-stat-card" key={label}><span>{label}</span><strong>{value == null ? '—' : value}</strong></article>)}
      </section>

      <section className="analytics-charts-row">
        <article className="analytics-panel analytics-trend-panel">
          <h2>Events over time</h2>
          {loading ? <SkeletonCard className="analytics-chart-skeleton" /> : summary?.trend?.length ? <ResponsiveContainer width="100%" height={260}><AreaChart data={summary.trend}><defs><linearGradient id="analyticsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F46E5" stopOpacity={0.2} /><stop offset="100%" stopColor="#4F46E5" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#F1F5F9" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} /><YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} /><Tooltip /><Area type="monotone" dataKey="count" stroke="#4F46E5" fill="url(#analyticsFill)" strokeWidth={2} /></AreaChart></ResponsiveContainer> : <div className="analytics-empty-chart"><BarChart3 size={28} /><span>No event activity in this range yet.</span></div>}
        </article>
        <article className="analytics-panel analytics-breakdown-panel">
          <h2>Event breakdown</h2>
          {loading ? <SkeletonCard className="analytics-breakdown-skeleton" /> : summary?.breakdown?.length ? <div className="analytics-breakdown-list">{summary.breakdown.map((row) => <div className="analytics-breakdown-row" key={row.event}><div><span>{row.event}</span><strong>{row.count}</strong></div><div className="analytics-share-track"><i style={{ width: `${(row.count / breakdownTotal) * 100}%` }} /></div></div>)}</div> : <div className="analytics-empty-state"><div><BarChart3 size={24} /></div><h3>No events recorded yet</h3><p>Engagement data will appear here as learners use your classes.</p></div>}
        </article>
      </section>
    </main>
  );
}
