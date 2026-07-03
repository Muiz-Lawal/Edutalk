import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/Dashboard.css';

export default function DashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [points, setPoints] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadPoints() {
      if (!user) return;
      try {
        const res = await api.get(`/points/balance/${user._id}`);
        if (mounted) setPoints(res.data.balance || 0);
      } catch (err) {
        console.warn('Failed to load points balance', err.message || err);
      }
    }
    loadPoints();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <h1>My Learning Dashboard</h1>

        <div className="dashboard-grid">
          <section className="dashboard-card">
            <h2>My Profile</h2>
            <div className="profile-info">
              <p>
                <strong>Name:</strong> {user?.firstName} {user?.lastName}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Member Since:</strong>{' '}
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
              <p>
                <strong>Points:</strong> {points != null ? points : '—'} (<Link to="/points">View history</Link>)
              </p>
            </div>
          </section>

          <section className="dashboard-card">
            <h2>My Enrollments</h2>
            <p>You haven't enrolled in any classes yet.</p>
            <Link to="/browse" className="btn btn-primary">
              Browse Classes
            </Link>
          </section>

          <section className="dashboard-card">
            <h2>Payment History</h2>
            <p>No payments yet.</p>
          </section>

          <section className="dashboard-card">
            <h2>Progress Tracking</h2>
            <p>Track your attendance, completion percentage, and achievements here.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
