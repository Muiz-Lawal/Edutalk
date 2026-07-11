import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import RecommendationMetrics from '../components/RecommendationMetrics';
import api from '../utils/api';
import '../styles/Dashboard.css';

export default function HostDashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.isHost) {
      fetchHostClasses();
    }
  }, [isAuthenticated, user?.isHost]);

  const fetchHostClasses = async () => {
    try {
      const response = await api.get('/classes/my-classes');
      setClasses(response.data);
      if (response.data.length > 0) {
        setSelectedClassId(response.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch host classes:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !user?.isHost) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>Host Dashboard</h1>

        <div className="host-stats">
          <div className="stat-card">
            <h3>Total Classes</h3>
            <p className="stat-number">{classes.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Students</h3>
            <p className="stat-number">{user?.totalActiveStudents || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Plan Tier</h3>
            <p className="stat-text">{user?.planTier?.toUpperCase() || 'STARTER'}</p>
          </div>
          <div className="stat-card">
            <h3>Average Rating</h3>
            <p className="stat-number">{user?.averageRating?.toFixed(1) || '0'}</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card quick-actions-card">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              <Link to="/create-class" className="btn btn-primary">
                ➕ Create Class
              </Link>
              <Link to="/moderation" className="btn btn-primary">
                🛡️ Moderation
              </Link>
              <Link to="/appeals" className="btn btn-primary">
                📋 Appeals
              </Link>
              <Link to="/analytics" className="btn btn-primary">
                📊 Analytics
              </Link>
              <Link to="/schedules" className="btn btn-primary">
                📅 Schedules
              </Link>
            </div>
          </section>

          <section className="dashboard-card">
            <h2>My Classes</h2>
            {classes.length > 0 ? (
              <div className="class-list">
                {classes.map((cls) => (
                  <div
                    key={cls._id}
                    className={`class-item ${selectedClassId === cls._id ? 'active' : ''}`}
                  >
                    <div onClick={() => setSelectedClassId(cls._id)} style={{ flex: 1, cursor: 'pointer' }}>
                      <h4>{cls.title}</h4>
                      <p className="class-category">{cls.category}</p>
                    </div>
                    <Link to={`/go-live/${cls._id}`} className="btn btn-success btn-sm">
                      Go Live
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p>You haven't created any classes yet.</p>
                <Link to="/create-class" className="btn btn-primary">Create a New Class</Link>
              </>
            )}
          </section>

          <section className="dashboard-card">
            <h2>Quick Stats</h2>
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="label">Total Revenue</span>
                <span className="value">$0.00</span>
              </div>
              <div className="quick-stat">
                <span className="label">Free Admission Slots</span>
                <span className="value">{user?.freeAdmissionSlots || 0}</span>
              </div>
              <div className="quick-stat">
                <span className="label">Students This Month</span>
                <span className="value">0</span>
              </div>
            </div>
          </section>
        </div>

        {selectedClassId && (
          <div className="recommendation-metrics-section">
            <RecommendationMetrics classId={selectedClassId} />
          </div>
        )}
        {selectedClassId && (
          <div className="analytics-section">
            <AnalyticsDashboard classId={selectedClassId} />
          </div>
        )}
      </div>
    </div>
  );
}
