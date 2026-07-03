import React from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/AnalyticsCharts.css';

export default function QualityDistribution({ data }) {
  if (!data) {
    return <div className="chart-container"><p className="chart-empty">Loading...</p></div>;
  }

  const distribution = data.distribution || {};

  // Filter out zero values
  const chartData = Object.entries(distribution)
    .filter(([, value]) => value > 0)
    .map(([quality, percentage]) => ({
      name: quality.toUpperCase(),
      value: percentage,
    }));

  // If all values are 0
  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <p className="chart-empty">No quality data available</p>
      </div>
    );
  }

  const COLORS = {
    '1080P': '#e74c3c',
    '720P': '#3498db',
    '480P': '#2ecc71',
    AUTO: '#f39c12',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-quality">{payload[0].payload.name}</p>
          <p className="tooltip-percentage">{payload[0].payload.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, value }) => `${name}: ${value}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name] || '#999'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Table */}
      <div className="quality-summary">
        <h3>Quality Breakdown</h3>
        <table className="summary-table">
          <tbody>
            {chartData.map((item, index) => (
              <tr key={index}>
                <td>
                  <span
                    className="quality-dot"
                    style={{ backgroundColor: COLORS[item.name] }}
                  ></span>
                  {item.name}
                </td>
                <td className="quality-percentage">{item.value}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
