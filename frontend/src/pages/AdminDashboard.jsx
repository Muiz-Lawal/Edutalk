import React, { useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import UserGrowthChart from '../components/UserGrowthChart';
import RevenueTrendChart from '../components/RevenueTrendChart';
import TopHostsTable from '../components/TopHostsTable';
import TopClassesTable from '../components/TopClassesTable';
import PlatformEngagementMetrics from '../components/PlatformEngagementMetrics';
import '../styles/admin.css';

export const AdminDashboard = () => {
  const { dashboardStats, loading, error, fetchDashboardStats } = useAdmin();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <h1>Dashboard</h1>

        {error && <div className="error-message">{error}</div>}

        {dashboardStats && (
          <>
            {/* KPI Cards */}
            <div className="admin-grid">
              <div className="stat-card">
                <div className="stat-label">Total Users</div>
                <div className="stat-value">{dashboardStats.totalUsers || 0}</div>
                <div className={`stat-change ${dashboardStats.userGrowth > 0 ? '' : 'negative'}`}>
                  {dashboardStats.userGrowth > 0 ? '↑' : '↓'} {dashboardStats.userGrowth} this month
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-label">Total Hosts</div>
                <div className="stat-value">{dashboardStats.totalHosts || 0}</div>
                <div className="stat-change">Active instructors</div>
              </div>

              <div className="stat-card success">
                <div className="stat-label">Total Classes</div>
                <div className="stat-value">{dashboardStats.totalClasses || 0}</div>
                <div className="stat-change">Live courses</div>
              </div>

              <div className="stat-card success">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value">${(dashboardStats.totalRevenue || 0).toFixed(2)}</div>
                <div className="stat-change">${(dashboardStats.revenueLastMonth || 0).toFixed(2)} this month</div>
              </div>

              <div className="stat-card warning">
                <div className="stat-label">Suspended Users</div>
                <div className="stat-value">{dashboardStats.suspendedUsers || 0}</div>
                <div className="stat-change">Temporarily inactive</div>
              </div>

              <div className="stat-card danger">
                <div className="stat-label">Banned Users</div>
                <div className="stat-value">{dashboardStats.bannedUsers || 0}</div>
                <div className="stat-change">Permanently blocked</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-section">
              <h2>Quick Actions</h2>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a href="/admin/users" className="btn btn-primary">
                  Manage Users
                </a>
                <a href="/admin/moderation" className="btn btn-primary">
                  Moderation Queue
                </a>
                <a href="/admin/payments" className="btn btn-primary">
                  Payment Reports
                </a>
                <a href="/admin/logs" className="btn btn-primary">
                  View Audit Logs
                </a>
                {user?.isSuperAdmin && (
                  <a href="/admin/management" className="btn btn-danger">
                    🔑 Manage Admins
                  </a>
                )}
              </div>
            </div>

            {/* Analytics Charts */}
            <div className="admin-section">
              <h2>Analytics & Trends</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
                <UserGrowthChart />
                <RevenueTrendChart />
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="admin-section">
              <h2>Platform Engagement</h2>
              <PlatformEngagementMetrics />
            </div>

            {/* Top Performers */}
            <div className="admin-section">
              <h2>Top Performers</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '20px', marginTop: '20px' }}>
                <TopHostsTable />
                <TopClassesTable />
              </div>
            </div>

            {/* System Information */}
            <div className="admin-section">
              <h2>System Information</h2>
              <div className="admin-table">
                <table>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Platform Status</td>
                      <td>
                        <span className="status-badge active">Healthy</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Database</td>
                      <td>
                        <span className="status-badge active">Connected</span>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>API Response Time</td>
                      <td>&lt;100ms</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Uptime</td>
                      <td>99.9%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};
