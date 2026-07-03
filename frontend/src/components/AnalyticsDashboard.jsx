import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/AnalyticsDashboard.css';

export default function AnalyticsDashboard({ classId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    fetchAnalytics();
  }, [classId, period]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/class/${classId}?period=${period}`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="error">No analytics data available</div>;
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Class Analytics</h2>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-select">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{analytics.totalEnrollments}</div>
          <div className="metric-label">Total Enrollments</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">${analytics.totalRevenue}</div>
          <div className="metric-label">Total Revenue</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.avgRating?.toFixed(1) || 'N/A'}</div>
          <div className="metric-label">Average Rating</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.completionRate || 0}%</div>
          <div className="metric-label">Completion Rate</div>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart">
          <h3>Revenue Trend</h3>
          <div className="chart-placeholder">
            {analytics.revenueData && (
              <div className="simple-chart">
                {analytics.revenueData.map((point, idx) => (
                  <div
                    key={idx}
                    className="chart-bar"
                    style={{ height: `${(point.amount / Math.max(...analytics.revenueData.map(p => p.amount))) * 200}px` }}
                    title={`${point.date}: $${point.amount}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="chart">
          <h3>Enrollment Trend</h3>
          <div className="chart-placeholder">
            {analytics.enrollmentData && (
              <div className="simple-chart">
                {analytics.enrollmentData.map((point, idx) => (
                  <div
                    key={idx}
                    className="chart-bar enrollment"
                    style={{ height: `${(point.count / Math.max(...analytics.enrollmentData.map(p => p.count))) * 200}px` }}
                    title={`${point.date}: ${point.count} students`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="engagement-section">
        <h3>Engagement Metrics</h3>
        <div className="engagement-metrics">
          <div className="engagement-item">
            <span className="label">Avg. Session Duration:</span>
            <span className="value">{analytics.avgSessionDuration} min</span>
          </div>
          <div className="engagement-item">
            <span className="label">Attendance Rate:</span>
            <span className="value">{analytics.attendanceRate}%</span>
          </div>
          <div className="engagement-item">
            <span className="label">Chat Activity:</span>
            <span className="value">{analytics.totalMessages} messages</span>
          </div>
          <div className="engagement-item">
            <span className="label">Retention Rate:</span>
            <span className="value">{analytics.retentionRate}%</span>
          </div>
        </div>
      </div>

      <div className="recommendations-section">
        <h3>AI Recommendations</h3>
        <div className="recommendations-list">
          {analytics.recommendations && analytics.recommendations.length > 0 ? (
            analytics.recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-item">
                <span className="recommendation-icon">💡</span>
                <p>{rec}</p>
              </div>
            ))
          ) : (
            <p>No recommendations at this time</p>
          )}
        </div>
      </div>

      <button className="btn btn-primary export-btn">📥 Export Report</button>
    </div>
  );
}
