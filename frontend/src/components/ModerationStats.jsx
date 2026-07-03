import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ModerationStats.css';

const ModerationStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('7d');

  const fetchStats = async (selectedPeriod) => {
    try {
      setLoading(true);
      const response = await axios.get('/api/moderation/stats', {
        params: { period: selectedPeriod },
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(period);
  }, [period]);

  if (loading && !stats) {
    return <div className="moderation-stats-loading">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="moderation-stats-error">Error loading statistics</div>;
  }

  const breakdownTotal =
    stats.breakdown.autoApproved +
    stats.breakdown.autoBlocked +
    stats.breakdown.reviewedApproved +
    stats.breakdown.reviewedRejected +
    stats.breakdown.pendingReview;

  return (
    <div className="moderation-stats">
      <div className="ms-header">
        <h2>Moderation Statistics</h2>
        <div className="ms-period-selector">
          <label>Period:</label>
          <select value={period} onChange={e => setPeriod(e.target.value)}>
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div className="ms-metrics">
        <div className="ms-metric ms-metric--total">
          <div className="ms-metric-value">{stats.totalContent}</div>
          <div className="ms-metric-label">Total Content Reviewed</div>
        </div>

        <div className="ms-metric ms-metric--flagged">
          <div className="ms-metric-value">{stats.flaggedContent}</div>
          <div className="ms-metric-label">Flagged Items</div>
          <div className="ms-metric-rate">{stats.flaggedRate}</div>
        </div>

        <div className="ms-metric ms-metric--human">
          <div className="ms-metric-value">{stats.breakdown.reviewedApproved + stats.breakdown.reviewedRejected}</div>
          <div className="ms-metric-label">Human Reviewed</div>
          <div className="ms-metric-rate">{stats.humanReviewRate}</div>
        </div>

        <div className="ms-metric ms-metric--pending">
          <div className="ms-metric-value">{stats.breakdown.pendingReview}</div>
          <div className="ms-metric-label">Pending Review</div>
        </div>
      </div>

      <div className="ms-breakdown">
        <h3>Action Breakdown</h3>
        <div className="ms-breakdown-grid">
          <div className="ms-breakdown-item">
            <span className="ms-breakdown-label">Auto Approved</span>
            <div className="ms-breakdown-bar">
              <div
                className="ms-breakdown-fill ms-breakdown-fill--approved"
                style={{
                  width: `${breakdownTotal > 0 ? (stats.breakdown.autoApproved / breakdownTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="ms-breakdown-value">{stats.breakdown.autoApproved}</span>
          </div>

          <div className="ms-breakdown-item">
            <span className="ms-breakdown-label">Auto Blocked</span>
            <div className="ms-breakdown-bar">
              <div
                className="ms-breakdown-fill ms-breakdown-fill--blocked"
                style={{
                  width: `${breakdownTotal > 0 ? (stats.breakdown.autoBlocked / breakdownTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="ms-breakdown-value">{stats.breakdown.autoBlocked}</span>
          </div>

          <div className="ms-breakdown-item">
            <span className="ms-breakdown-label">Human Approved</span>
            <div className="ms-breakdown-bar">
              <div
                className="ms-breakdown-fill ms-breakdown-fill--reviewed-approved"
                style={{
                  width: `${breakdownTotal > 0 ? (stats.breakdown.reviewedApproved / breakdownTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="ms-breakdown-value">{stats.breakdown.reviewedApproved}</span>
          </div>

          <div className="ms-breakdown-item">
            <span className="ms-breakdown-label">Human Rejected</span>
            <div className="ms-breakdown-bar">
              <div
                className="ms-breakdown-fill ms-breakdown-fill--reviewed-rejected"
                style={{
                  width: `${breakdownTotal > 0 ? (stats.breakdown.reviewedRejected / breakdownTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="ms-breakdown-value">{stats.breakdown.reviewedRejected}</span>
          </div>

          <div className="ms-breakdown-item">
            <span className="ms-breakdown-label">Pending Review</span>
            <div className="ms-breakdown-bar">
              <div
                className="ms-breakdown-fill ms-breakdown-fill--pending"
                style={{
                  width: `${breakdownTotal > 0 ? (stats.breakdown.pendingReview / breakdownTotal) * 100 : 0}%`,
                }}
              />
            </div>
            <span className="ms-breakdown-value">{stats.breakdown.pendingReview}</span>
          </div>
        </div>
      </div>

      <div className="ms-insights">
        <h3>Key Insights</h3>
        <ul>
          <li>
            <strong>Flagged Rate:</strong> {stats.flaggedRate} of all content was flagged for review during this period
          </li>
          <li>
            <strong>Human Review Rate:</strong> {stats.humanReviewRate} of content received human review
          </li>
          <li>
            <strong>Auto-Moderation Success:</strong> {stats.breakdown.autoApproved + stats.breakdown.autoBlocked > 0
              ? (
                  ((stats.breakdown.autoApproved + stats.breakdown.autoBlocked) /
                    (stats.totalContent - stats.breakdown.pendingReview)) *
                  100
                ).toFixed(1)
              : 0}
            % of content was resolved automatically
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ModerationStats;