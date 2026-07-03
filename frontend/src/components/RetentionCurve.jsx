import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '../styles/AnalyticsCharts.css';

export default function RetentionCurve({ data }) {
  if (!data) {
    return (
      <div className="chart-container">
        <p className="chart-empty">Loading...</p>
      </div>
    );
  }

  const retention = data.retention || {};

  // Format data for bar chart
  const chartData = [
    { label: '5 min', viewers: retention['5min'] || 0, percentage: true },
    { label: '10 min', viewers: retention['10min'] || 0, percentage: true },
    { label: '15 min', viewers: retention['15min'] || 0, percentage: true },
    { label: '30 min', viewers: retention['30min'] || 0, percentage: true },
    { label: '60 min', viewers: retention['60min'] || 0, percentage: true },
  ].filter((item) => item.viewers > 0 || retention.total > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.label}</p>
          <p className="tooltip-value">
            {payload[0].payload.viewers}% retained
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="retention-curve">
      {/* Bar Chart */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="label"
              stroke="#666"
              tick={{ fontSize: 12 }}
              label={{ value: 'Watch Time', position: 'insideBottomRight', offset: -5 }}
            />
            <YAxis
              stroke="#2ecc71"
              label={{
                value: 'Retention Rate (%)',
                angle: -90,
                position: 'insideLeft',
              }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="viewers"
              fill="#2ecc71"
              radius={[8, 8, 0, 0]}
              name="Retention Rate"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Retention Summary */}
      <div className="retention-summary">
        <h3>Retention Summary</h3>
        <div className="retention-stats">
          <div className="retention-stat">
            <h4>Total Viewers</h4>
            <p className="stat-value">{retention.total || 0}</p>
          </div>
          <div className="retention-stat">
            <h4>Retention at 5 min</h4>
            <p className="stat-value">{retention['5min'] || 0}%</p>
          </div>
          <div className="retention-stat">
            <h4>Retention at 30 min</h4>
            <p className="stat-value">{retention['30min'] || 0}%</p>
          </div>
          <div className="retention-stat">
            <h4>Full Duration</h4>
            <p className="stat-value">{retention['60min'] || 0}%</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="retention-insights">
        <h3>Key Insights</h3>
        <ul>
          <li>
            <strong>Early Dropoff:</strong> {100 - (retention['5min'] || 0)}% of viewers
            left within the first 5 minutes
          </li>
          <li>
            <strong>Mid-stream Retention:</strong> {retention['30min'] || 0}% stayed
            through the 30-minute mark
          </li>
          <li>
            <strong>Completion Rate:</strong> {retention['60min'] || 0}% watched the
            entire stream
          </li>
          {(retention['5min'] || 0) < 60 && (
            <li>
              <strong>Recommendation:</strong> Consider improving stream opening or
              introductory content
            </li>
          )}
          {(retention['60min'] || 0) > 70 && (
            <li>
              <strong>Strong Performance:</strong> Excellent viewer retention! Keep up
              this content quality
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
