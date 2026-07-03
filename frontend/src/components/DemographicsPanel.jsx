import React from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import '../styles/DemographicsPanel.css';

export default function DemographicsPanel({ data }) {
  if (!data) {
    return (
      <div className="demographics-panel">
        <p className="chart-empty">Loading demographics...</p>
      </div>
    );
  }

  const browsers = data.browsers || {};
  const operatingSystems = data.operatingSystems || {};
  const deviceTypes = data.deviceTypes || {};

  // Format data for charts
  const browserData = Object.entries(browsers)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, value: count }));

  const osData = Object.entries(operatingSystems)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, value: count }));

  const deviceData = Object.entries(deviceTypes)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, value: count }));

  const COLORS_BROWSER = {
    Chrome: '#4285F4',
    Firefox: '#FF7139',
    Safari: '#555555',
    Edge: '#0078D4',
    Other: '#999999',
  };

  const COLORS_OS = {
    Windows: '#0078D4',
    MacOS: '#A2AAAD',
    Linux: '#FCC624',
    iOS: '#555555',
    Android: '#3DDC84',
  };

  const COLORS_DEVICE = {
    Desktop: '#3498db',
    Tablet: '#2ecc71',
    Mobile: '#e74c3c',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].payload.name}</p>
          <p className="tooltip-value">{payload[0].payload.value} viewers</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="demographics-panel">
      {/* Browser Distribution */}
      <div className="demographics-section">
        <div className="section-header">
          <h3>Browser Distribution</h3>
          <p>Which browsers viewers used</p>
        </div>
        {browserData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={browserData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {browserData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_BROWSER[entry.name] || '#999'}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="chart-empty">No browser data available</p>
        )}
      </div>

      {/* Operating System Distribution */}
      <div className="demographics-section">
        <div className="section-header">
          <h3>Operating System Distribution</h3>
          <p>Which operating systems viewers used</p>
        </div>
        {osData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={osData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3498db" radius={[8, 8, 0, 0]}>
                  {osData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_OS[entry.name] || '#999'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="chart-empty">No OS data available</p>
        )}
      </div>

      {/* Device Type Distribution */}
      <div className="demographics-section">
        <div className="section-header">
          <h3>Device Type Distribution</h3>
          <p>Desktop, Tablet, or Mobile viewers</p>
        </div>
        {deviceData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3498db" radius={[8, 8, 0, 0]}>
                  {deviceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS_DEVICE[entry.name] || '#999'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="chart-empty">No device data available</p>
        )}
      </div>

      {/* Demographics Summary Table */}
      <div className="demographics-summary">
        <h3>Demographics Summary</h3>
        <div className="summary-tables">
          <div className="summary-table-wrapper">
            <h4>Browsers</h4>
            <table className="demographics-table">
              <tbody>
                {browserData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.value} viewers</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-table-wrapper">
            <h4>Operating Systems</h4>
            <table className="demographics-table">
              <tbody>
                {osData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.value} viewers</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary-table-wrapper">
            <h4>Device Types</h4>
            <table className="demographics-table">
              <tbody>
                {deviceData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.value} viewers</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
