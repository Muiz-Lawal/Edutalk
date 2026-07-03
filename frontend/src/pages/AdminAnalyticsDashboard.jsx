import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminAnalyticsDashboard.css';

export default function AdminAnalyticsDashboard() {
  const [engagement, setEngagement] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('action');
  
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    classId: '',
    minCount: 0,
  });

  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('start', filters.startDate);
      if (filters.endDate) params.append('end', filters.endDate);
      if (filters.classId) params.append('classId', filters.classId);

      const res = await axios.get(`/api/analytics/engagement?${params}`);
      let data = res.data.data || [];
      
      // Filter by minimum count
      data = data.filter(d => d.count >= filters.minCount);
      
      // Sort by count descending
      data.sort((a, b) => b.count - a.count);
      
      setEngagement(data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = () => {
    fetchAnalytics();
  };

  const handleExport = async () => {
    if (engagement.length === 0) {
      alert('No data to export');
      return;
    }
    setExporting(true);
    try {
      if (exportFormat === 'csv') {
        exportToCSV();
      } else if (exportFormat === 'json') {
        exportToJSON();
      }
    } catch (err) {
      alert('Export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Action', 'Count', 'Unique Users', 'Percentage', 'Timestamp'];
    const rows = engagement.map((e, idx) => [
      e.action,
      e.count,
      e.uniqueUsers,
      ((e.count / engagement.reduce((s, x) => s + x.count, 0)) * 100).toFixed(2) + '%',
      new Date().toISOString(),
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    downloadFile(csv, `analytics_${new Date().getTime()}.csv`, 'text/csv');
  };

  const exportToJSON = () => {
    const total = engagement.reduce((s, e) => s + e.count, 0);
    const data = {
      exportDate: new Date().toISOString(),
      filters,
      summary: {
        totalEvents: total,
        totalActions: engagement.length,
        uniqueUsers: engagement.reduce((s, e) => s + e.uniqueUsers, 0),
        averageCount: (total / engagement.length).toFixed(2),
      },
      events: engagement.map(e => ({
        ...e,
        percentage: ((e.count / total) * 100).toFixed(2),
      })),
    };
    downloadFile(JSON.stringify(data, null, 2), `analytics_${new Date().getTime()}.json`, 'application/json');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalEvents = engagement.reduce((s, e) => s + e.count, 0);
  const totalUsers = engagement.reduce((s, e) => s + e.uniqueUsers, 0);
  const topAction = engagement[0];

  return (
    <div className="admin-analytics-dashboard">
      <div className="admin-dashboard-header">
        <h1>📊 Platform Analytics Dashboard</h1>
        <p className="subtitle">Real-time event tracking and engagement metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="analytics-summary-grid">
        <div className="summary-card metric-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Total Events</h3>
            <p className="metric-value">{totalEvents.toLocaleString()}</p>
            <span className="metric-label">across all actions</span>
          </div>
        </div>
        <div className="summary-card metric-card">
          <div className="card-icon">👥</div>
          <div className="card-content">
            <h3>Unique Users</h3>
            <p className="metric-value">{totalUsers.toLocaleString()}</p>
            <span className="metric-label">active participants</span>
          </div>
        </div>
        <div className="summary-card metric-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Top Action</h3>
            <p className="metric-value">{topAction?.action || 'N/A'}</p>
            <span className="metric-label">{topAction?.count || 0} events</span>
          </div>
        </div>
        <div className="summary-card metric-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Avg Events/User</h3>
            <p className="metric-value">{totalUsers > 0 ? (totalEvents / totalUsers).toFixed(2) : 0}</p>
            <span className="metric-label">engagement rate</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="admin-filters-section">
        <h2>Filters & Export</h2>
        <div className="filters-container">
          <div className="filter-group">
            <label>Start Date</label>
            <input 
              type="date" 
              name="startDate" 
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input 
              type="date" 
              name="endDate" 
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>Class ID (Optional)</label>
            <input 
              type="text" 
              name="classId" 
              value={filters.classId}
              onChange={handleFilterChange}
              placeholder="Leave blank for all classes"
            />
          </div>
          <div className="filter-group">
            <label>Min Events</label>
            <input 
              type="number" 
              name="minCount"
              value={filters.minCount}
              onChange={handleFilterChange}
              min="0"
            />
          </div>
          <button 
            onClick={handleApplyFilter} 
            disabled={loading}
            className="btn-apply-filter"
          >
            {loading ? '⏳ Loading...' : '🔍 Apply Filters'}
          </button>
        </div>

        <div className="export-section">
          <div className="export-controls">
            <select 
              value={exportFormat} 
              onChange={(e) => setExportFormat(e.target.value)}
              className="export-select"
            >
              <option value="csv">📄 Export as CSV</option>
              <option value="json">📋 Export as JSON</option>
            </select>
            <button 
              onClick={handleExport} 
              disabled={exporting || engagement.length === 0}
              className="btn-export"
            >
              {exporting ? '⏳ Exporting...' : '💾 Export'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <div className="admin-error-message">{error}</div>}

      {/* Data Table */}
      <div className="analytics-data-section">
        <h2>Event Breakdown</h2>
        {engagement.length === 0 ? (
          <div className="no-data-message">
            <p>📭 No events found for the selected date range</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Action</th>
                  <th>Events</th>
                  <th>Unique Users</th>
                  <th>% of Total</th>
                  <th>Avg Users/Event</th>
                </tr>
              </thead>
              <tbody>
                {engagement.map((e, idx) => (
                  <tr key={idx} className={idx < 3 ? 'top-action' : ''}>
                    <td className="rank-cell">{idx + 1}</td>
                    <td className="action-cell">{e.action}</td>
                    <td className="count-cell">{e.count}</td>
                    <td className="users-cell">{e.uniqueUsers}</td>
                    <td className="percent-cell">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${(e.count / totalEvents) * 100}%` }}
                        ></div>
                        <span>{((e.count / totalEvents) * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="avg-cell">
                      {(e.count / e.uniqueUsers).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistics Footer */}
      {engagement.length > 0 && (
        <div className="analytics-footer">
          <div className="footer-stat">
            <span className="stat-label">Total Records:</span>
            <span className="stat-value">{engagement.length}</span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">Date Range:</span>
            <span className="stat-value">{filters.startDate} to {filters.endDate}</span>
          </div>
          <div className="footer-stat">
            <span className="stat-label">Last Updated:</span>
            <span className="stat-value">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
