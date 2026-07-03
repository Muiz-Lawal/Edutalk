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
} from 'recharts';
import '../styles/AnalyticsCharts.css';

export default function ViewerTimeline({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <p className="chart-empty">No data available</p>
      </div>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    time: new Date(item.time).toLocaleTimeString(),
    viewers: item.viewers || 0,
    bitrate: item.bitrate || 0,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-time">{payload[0].payload.time}</p>
          <p className="tooltip-viewers">
            👥 Viewers: {payload[0].payload.viewers}
          </p>
          <p className="tooltip-bitrate">
            📊 Bitrate: {Math.round(payload[0].payload.bitrate)} kbps
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
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
            stroke="#3498db"
            label={{ value: 'Viewers', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#2ecc71"
            label={{
              value: 'Bitrate (kbps)',
              angle: 90,
              position: 'insideRight',
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="viewers"
            stroke="#3498db"
            dot={false}
            strokeWidth={2}
            name="Viewer Count"
            isAnimationActive={true}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="bitrate"
            stroke="#2ecc71"
            dot={false}
            strokeWidth={2}
            name="Bitrate (kbps)"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
