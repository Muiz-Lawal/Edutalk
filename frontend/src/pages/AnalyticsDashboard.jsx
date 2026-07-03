import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AnalyticsDashboard.css';

export default function AnalyticsDashboard() {
  const [engagement, setEngagement] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ startDate: '', endDate: '', classId: '' });

  useEffect(() => {
    fetchEngagement();
  }, []);

  const fetchEngagement = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter.startDate) params.append('start', filter.startDate);
      if (filter.endDate) params.append('end', filter.endDate);
      if (filter.classId) params.append('classId', filter.classId);

      const res = await axios.get(`/api/analytics/engagement?${params}`);
      setEngagement(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = () => {
    fetchEngagement();
  };

  const totalViews = engagement.reduce((sum, e) => sum + e.count, 0);
  const uniqueUsers = engagement.reduce((sum, e) => sum + e.uniqueUsers, 0);

  return (
    <div className="analytics-dashboard">
      <h1>📊 Analytics Dashboard</h1>
      
      <div className="analytics-filters">
        <h3>Filters</h3>
        <div className="filter-row">
          <input 
            type="date" 
            name="startDate" 
            value={filter.startDate} 
            onChange={handleFilterChange}
            placeholder="Start Date"
          />
          <input 
            type="date" 
            name="endDate" 
            value={filter.endDate} 
            onChange={handleFilterChange}
            placeholder="End Date"
          />
          <input 
            type="text" 
            name="classId" 
            value={filter.classId} 
            onChange={handleFilterChange}
            placeholder="Class ID (optional)"
          />
          <button onClick={handleApplyFilter} disabled={loading}>
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </div>

      {error && <div className="analytics-error">{error}</div>}

      <div className="analytics-summary">
        <div className="summary-card">
          <h3>Total Events</h3>
          <p className="summary-value">{totalViews}</p>
        </div>
        <div className="summary-card">
          <h3>Unique Users</h3>
          <p className="summary-value">{uniqueUsers}</p>
        </div>
        <div className="summary-card">
          <h3>Avg Events/User</h3>
          <p className="summary-value">
            {uniqueUsers > 0 ? (totalViews / uniqueUsers).toFixed(2) : 0}
          </p>
        </div>
      </div>

      <div className="analytics-table">
        <h3>Event Breakdown</h3>
        {engagement.length === 0 ? (
          <p className="no-data">No events recorded yet</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Count</th>
                <th>Unique Users</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {engagement.map((e, idx) => (
                <tr key={idx}>
                  <td>{e.action}</td>
                  <td>{e.count}</td>
                  <td>{e.uniqueUsers}</td>
                  <td>{totalViews > 0 ? ((e.count / totalViews) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
