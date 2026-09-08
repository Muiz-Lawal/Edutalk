import React, { useEffect, useState } from 'react';
import { ArrowRight, Info, Sparkles } from 'lucide-react';
import api from '../utils/api';
import AsyncBoundary from './AsyncBoundary';
import Badge from './ui/Badge';
import '../styles/Dashboard.css';

export default function RecommendationMetrics({ classId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = async () => {
    try {
      setLoading(true);
      setError(false);
      const { data } = await api.get('/analytics/recommendations', { params: { classId } });
      setMetrics(data);
    } catch (requestError) {
      console.error('Error fetching recommendation metrics', requestError);
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (classId) load(); }, [classId]);

  if (loading || error || !metrics) return <AsyncBoundary loading={loading} error={error} empty={!metrics && !loading && !error} onRetry={load} emptyMessage="Recommendation data will appear as your classes gather activity." />;
  const cards = [['Recommendation Views', 'Number of times recommended classes were shown.', metrics.recommendationViews ?? 0], ['Recommendation Clicks', 'Number of times students opened a recommended class.', metrics.totalRecommendationClicks ?? 0], ['Click-through Rate', 'Recommendation clicks divided by recommendation views.', metrics.clickThroughRate == null ? '—' : `${metrics.clickThroughRate}%`], ['Tracked Classes', 'Number of host classes included in recommendation tracking.', metrics.hostClassCount ?? 0]];
  return <section className="dashboard-card recommendation-metrics-card"><div className="analytics-section-header"><h2>Recommendation Performance</h2><span title="How students interact with recommendations"><Info size={16} /></span></div><div className="recommendation-metrics-grid">{cards.map(([label, help, value]) => <div className="metric-card" key={label}><div className="metric-label">{label}<span title={help}><Info size={14} /></span></div><div className="metric-value">{value}</div></div>)}</div><div className="recommendation-top-classes"><div className="analytics-section-header"><h2>Top Clicked Classes</h2></div>{metrics.topClasses?.length ? <div className="recommendation-class-list">{metrics.topClasses.map((item, index) => <div className="recommendation-class-row" key={item.classId}><strong className="recommendation-rank">{index + 1}</strong><div className="recommendation-thumbnail">{item.title?.charAt(0) || 'C'}</div><div className="recommendation-class-title">{item.title}</div><Badge variant="primary">{item.clicks ?? 0} clicks</Badge><span className="recommendation-ctr">{item.ctr == null ? '—' : `${item.ctr}%`} CTR</span></div>)}</div> : <div className="analytics-empty"><Sparkles size={22} /><p>No click data yet — view your classes to build recommendation activity.</p><a href="/host-dashboard">View classes <ArrowRight size={14} /></a></div>}</div></section>;
}
