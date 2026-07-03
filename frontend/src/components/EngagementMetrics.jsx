import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import '../styles/AnalyticsCharts.css';

export default function EngagementMetrics({ data }) {
  if (!data) {
    return <div className="chart-container"><p className="chart-empty">Loading...</p></div>;
  }

  const engagement = data.engagement || {};
  const timeline = data.timeline || [];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">
            {new Date(payload[0].payload.time).toLocaleTimeString()}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartData = timeline.map((item) => ({
    time: new Date(item.time).toLocaleTimeString(),
    engagement: Math.round(item.engagement || 0),
    chatMessages: item.chatMessages || 0,
  }));

  return (
    <div className="engagement-metrics">
      {/* KPI Cards */}
      <div className="engagement-kpis">
        <div className="engagement-kpi">
          <h4>Average Engagement Score</h4>
          <p className="kpi-number">{engagement.averageScore || 0}/100</p>
        </div>
        <div className="engagement-kpi">
          <h4>Chat Messages</h4>
          <p className="kpi-number">{engagement.totalChatMessages || 0}</p>
        </div>
        <div className="engagement-kpi">
          <h4>Chat Participation Rate</h4>
          <p className="kpi-number">
            {Math.round(engagement.chatParticipationRate || 0)}%
          </p>
        </div>
        <div className="engagement-kpi">
          <h4>Average Watch Time</h4>
          <p className="kpi-number">{engagement.averageWatchTime || 0} min</p>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="chart-container">
        <h3>Engagement Over Time</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="time"
              stroke="#666"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              stroke="#9b59b6"
              label={{
                value: 'Engagement Score',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#e74c3c"
              label={{
                value: 'Chat Messages',
                angle: 90,
                position: 'insideRight',
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="engagement"
              stroke="#9b59b6"
              dot={false}
              strokeWidth={2}
              name="Engagement Score"
            />
            <Line
              yAxisId="right"
              type="stepAfter"
              dataKey="chatMessages"
              stroke="#e74c3c"
              dot={false}
              strokeWidth={2}
              name="Chat Messages"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div className="engagement-insights">
        <h3>Insights</h3>
        <ul>
          <li>
            <strong>Most Engaged Metric:</strong>{' '}
            {engagement.chatParticipationRate > 30
              ? 'High chat participation'
              : 'Focus on building community'}
          </li>
          <li>
            <strong>Watch Time:</strong> Viewers stayed an average of{' '}
            {engagement.averageWatchTime || 0} minutes
          </li>
          <li>
            <strong>Chat Health:</strong> {engagement.totalChatMessages} messages from{' '}
            {engagement.totalViewers} viewers
          </li>
        </ul>
      </div>
    </div>
  );
}
