import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AnalyticsOverview from '../components/AnalyticsOverview';
import ViewerTimeline from '../components/ViewerTimeline';
import EngagementMetrics from '../components/EngagementMetrics';
import QualityDistribution from '../components/QualityDistribution';
import RetentionCurve from '../components/RetentionCurve';
import DemographicsPanel from '../components/DemographicsPanel';
import '../styles/StreamAnalytics.css';

export default function StreamAnalyticsPage() {
  const { streamId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [engagementData, setEngagementData] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    fetchAnalyticsData();
  }, [streamId, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all analytics data in parallel
      const [overview, timeline, engagement, quality, demographics, retention] =
        await Promise.all([
          axios.get(`/api/analytics/live/streams/${streamId}`, { headers }),
          axios.get(`/api/analytics/live/streams/${streamId}/timeline`, {
            headers,
          }),
          axios.get(`/api/analytics/live/streams/${streamId}/engagement`, {
            headers,
          }),
          axios.get(`/api/analytics/live/streams/${streamId}/quality`, {
            headers,
          }),
          axios.get(`/api/analytics/live/streams/${streamId}/demographics`, {
            headers,
          }),
          axios.get(`/api/analytics/live/streams/${streamId}/retention`, {
            headers,
          }),
        ]);

      setAnalytics(overview.data);
      setTimelineData(timeline.data.timeline || []);
      setEngagementData(engagement.data);
      setQualityData(quality.data);
      setDemographics(demographics.data);
      setRetentionData(retention.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="stream-analytics-page">
        <div className="analytics-loading">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stream-analytics-page">
        <div className="analytics-error">
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className="btn-retry">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="stream-analytics-page">
        <div className="analytics-empty">
          <h2>No Analytics Available</h2>
          <p>This stream hasn't been analyzed yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stream-analytics-page">
      <div className="analytics-header">
        <div className="header-content">
          <h1>Stream Analytics</h1>
          <p className="stream-title">{analytics.stream?.title}</p>
          <p className="stream-date">
            {new Date(analytics.stream?.startedAt).toLocaleDateString()} -{' '}
            {new Date(analytics.stream?.startedAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="time-range-selector">
          <label htmlFor="timeRange">Time Range:</label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="range-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="analytics-section">
        <AnalyticsOverview data={analytics.overview} />
      </section>

      {/* Viewer Timeline Chart */}
      <section className="analytics-section">
        <div className="section-header">
          <h2>Viewer Timeline</h2>
          <p>Real-time viewer count throughout the stream</p>
        </div>
        <ViewerTimeline data={timelineData} />
      </section>

      {/* Quality Distribution Chart */}
      <section className="analytics-section">
        <div className="section-header">
          <h2>Quality Distribution</h2>
          <p>Percentage of viewers per quality level</p>
        </div>
        <QualityDistribution data={qualityData} />
      </section>

      {/* Engagement Metrics */}
      <section className="analytics-section">
        <div className="section-header">
          <h2>Engagement Metrics</h2>
          <p>Chat activity and viewer interaction</p>
        </div>
        <EngagementMetrics data={engagementData} />
      </section>

      {/* Retention Curve */}
      <section className="analytics-section">
        <div className="section-header">
          <h2>Retention Curve</h2>
          <p>How long viewers stayed during the stream</p>
        </div>
        <RetentionCurve data={retentionData} />
      </section>

      {/* Demographics */}
      <section className="analytics-section">
        <div className="section-header">
          <h2>Viewer Demographics</h2>
          <p>Browser, OS, and device breakdown</p>
        </div>
        <DemographicsPanel data={demographics} />
      </section>
    </div>
  );
}
