import React from 'react';
import '../styles/AnalyticsOverview.css';

export default function AnalyticsOverview({ data }) {
  if (!data) return <div className="overview-loading">Loading metrics...</div>;

  const kpis = [
    {
      title: 'Total Viewers',
      value: data.totalViewers || 0,
      icon: '👥',
      color: '#3498db',
    },
    {
      title: 'Peak Viewers',
      value: data.peakViewers || 0,
      icon: '📈',
      color: '#2ecc71',
    },
    {
      title: 'Avg Watch Time',
      value: `${Math.round(data.averageWatchTime || 0)} min`,
      icon: '⏱️',
      color: '#9b59b6',
    },
    {
      title: 'Engagement Score',
      value: `${Math.round(data.engagementScore || 0)}/100`,
      icon: '⚡',
      color: '#f39c12',
    },
    {
      title: 'Chat Messages',
      value: data.totalChatMessages || 0,
      icon: '💬',
      color: '#e74c3c',
    },
  ];

  return (
    <div className="analytics-overview">
      <div className="kpi-grid">
        {kpis.map((kpi, index) => (
          <div key={index} className="kpi-card" style={{ borderTopColor: kpi.color }}>
            <div className="kpi-icon">{kpi.icon}</div>
            <div className="kpi-content">
              <p className="kpi-title">{kpi.title}</p>
              <p className="kpi-value">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
