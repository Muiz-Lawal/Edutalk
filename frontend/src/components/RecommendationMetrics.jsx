import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/Dashboard.css';

export default function RecommendationMetrics({ classId }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    setError(null);

    api.get('/analytics/recommendations', {
      params: { classId },
    })
      .then((response) => {
        setMetrics(response.data);
      })
      .catch((err) => {
        console.error('Error fetching recommendation metrics:', err);
        setError('Unable to load recommendation metrics.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [classId]);

  if (loading) {
    return <div className="loading">Loading recommendation metrics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!metrics) {
    return <div className="error">No recommendation metrics available.</div>;
  }

  return (
    <div className="dashboard-card recommendation-metrics-card">
      <h2>Recommendation Performance</h2>
      <div className="recommendation-metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{metrics.recommendationViews}</div>
          <div className="metric-label">Recommendation Views</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.totalRecommendationClicks}</div>
          <div className="metric-label">Recommendation Clicks</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.clickThroughRate}%</div>
          <div className="metric-label">Click-through Rate</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{metrics.hostClassCount}</div>
          <div className="metric-label">Tracked Classes</div>
        </div>
      </div>

      <div className="recommendation-top-classes">
        <h3>Top Clicked Classes</h3>
        {metrics.topClasses && metrics.topClasses.length > 0 ? (
          <ul>
            {metrics.topClasses.map((item) => (
              <li key={item.classId}>
                <strong>{item.title}</strong> — {item.clicks} clicks
              </li>
            ))}
          </ul>
        ) : (
          <p>No click data available yet.</p>
        )}
      </div>
    </div>
  );
}
