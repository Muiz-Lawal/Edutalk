import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { AdminLayout } from '../components/AdminLayout';
import UserGrowthChart from '../components/UserGrowthChart';
import RevenueTrendChart from '../components/RevenueTrendChart';
import TopHostsTable from '../components/TopHostsTable';
import TopClassesTable from '../components/TopClassesTable';
import PlatformEngagementMetrics from '../components/PlatformEngagementMetrics';
import '../styles/admin.css';
import { Skeleton } from '../components/AsyncBoundary';
import { formatPrice } from '../lib/currency';

const AdminDashboard = () => {
  const { dashboardStats, loading, error, fetchDashboardStats } = useAdmin();

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const { hasPermission, adminRole } = useAdminPermissions();
  const isFinanceAdmin = adminRole === 'finance_admin';
  const isSupport = adminRole === 'support';
  const isSuperAdmin = adminRole === 'superadmin';
  const canViewPayments = hasPermission('view_payments');
  const canViewAudit = hasPermission('view_audit_logs');
  const canModerate = hasPermission('moderate_content') && !isFinanceAdmin;

  const roleConfigs = {
    support: {
      label: 'Support',
      summary: 'Tickets, onboarding issues, account access, and goodwill cases.',
      cards: [
        { label: 'Open Tickets', value: dashboardStats?.openTickets ?? 18, tone: '', change: '2 critical', kind: 'normal' },
        { label: 'SLA Hit Rate', value: '87%', tone: 'success', change: 'Last 24h', kind: 'success' },
        { label: 'Escalations', value: dashboardStats?.escalations ?? 4, tone: 'warning', change: 'Awaiting review', kind: 'warning' },
        { label: 'Goodwill Credits', value: dashboardStats?.goodwillCredits ?? 7, tone: 'danger', change: 'Logged this week', kind: 'danger' },
      ],
      actions: [
        { href: '/admin/support', label: 'Open support queue', className: 'btn btn-primary' },
        { href: '/admin/users', label: 'Review user profiles', className: 'btn btn-secondary' },
      ],
      showCharts: false,
    },
    moderator: {
      label: 'Moderator',
      summary: 'Flagged content, review queues, and class moderation workflows.',
      cards: [
        { label: 'Flagged Items', value: dashboardStats?.flaggedItems ?? 24, tone: '', change: '12 pending', kind: 'normal' },
        { label: 'Reports', value: dashboardStats?.reports ?? 9, tone: 'warning', change: 'Need review', kind: 'warning' },
        { label: 'AI Flags', value: dashboardStats?.aiFlags ?? 13, tone: 'success', change: 'Handled today', kind: 'success' },
        { label: 'Hidden Classes', value: dashboardStats?.hiddenClasses ?? 3, tone: 'danger', change: 'Policy actioned', kind: 'danger' },
      ],
      actions: [
        { href: '/admin/moderation', label: 'Moderation queue', className: 'btn btn-primary' },
        { href: '/admin/moderation', label: 'Check user reports', className: 'btn btn-secondary' },
      ],
      showCharts: false,
    },
    finance_admin: {
      label: 'Finance Admin',
      summary: 'Refunds, payouts, settlements, and financial auditing visibility.',
      cards: [
        { label: 'Pending Refunds', value: dashboardStats?.pendingRefunds ?? 14, tone: 'warning', change: 'Review required', kind: 'warning' },
        { label: 'Chargebacks', value: dashboardStats?.chargebacks ?? 3, tone: 'danger', change: 'Escalated', kind: 'danger' },
        { label: 'Payouts Due', value: formatPrice((dashboardStats?.payoutsDue ?? 18420) * 100), tone: 'success', change: 'This cycle', kind: 'success' },
        { label: 'Revenue Today', value: formatPrice((dashboardStats?.revenueToday ?? 2240) * 100), tone: '', change: 'Net before fees', kind: 'normal' },
      ],
      actions: [
        { href: '/admin/payments', label: 'Payment reports', className: 'btn btn-primary' },
        { href: '/admin/logs', label: 'Audit trail', className: 'btn btn-secondary' },
      ],
      showCharts: true,
    },
    admin: {
      label: 'Admin',
      summary: 'Operations overview across users, classes, host health, and platform risk.',
      cards: [
        { label: 'Total Users', value: dashboardStats?.totalUsers ?? 0, tone: '', change: `${dashboardStats?.userGrowth ?? 0} this month`, kind: 'normal' },
        { label: 'Total Hosts', value: dashboardStats?.totalHosts ?? 0, tone: 'success', change: 'Active instructors', kind: 'success' },
        { label: 'Total Classes', value: dashboardStats?.totalClasses ?? 0, tone: 'success', change: 'Live courses', kind: 'success' },
        { label: 'Total Revenue', value: formatPrice((dashboardStats?.totalRevenue ?? 0) * 100), tone: 'success', change: `${formatPrice((dashboardStats?.revenueLastMonth ?? 0) * 100)} this month`, kind: 'success' },
        { label: 'Suspended Users', value: dashboardStats?.suspendedUsers ?? 0, tone: 'warning', change: 'Temporarily inactive', kind: 'warning' },
        { label: 'Banned Users', value: dashboardStats?.bannedUsers ?? 0, tone: 'danger', change: 'Permanently blocked', kind: 'danger' },
      ],
      actions: [
        { href: '/admin/users', label: 'Manage users', className: 'btn btn-primary' },
        { href: '/admin/moderation', label: 'Moderation queue', className: 'btn btn-primary' },
        { href: '/admin/payments', label: 'Payment reports', className: 'btn btn-primary' },
        { href: '/admin/logs', label: 'Audit logs', className: 'btn btn-secondary' },
      ],
      showCharts: true,
    },
    superadmin: {
      label: 'SuperAdmin',
      summary: 'Full platform command center for risk, governance, payouts, and policy settings.',
      cards: [
        { label: 'Platform Health', value: '99.9%', tone: 'success', change: 'Uptime', kind: 'success' },
        { label: 'Approval Queue', value: dashboardStats?.approvalQueue ?? 7, tone: 'warning', change: 'Awaiting sign-off', kind: 'warning' },
        { label: 'Security Alerts', value: dashboardStats?.securityAlerts ?? 5, tone: 'danger', change: 'High-priority', kind: 'danger' },
        { label: 'Admin Roles', value: '5', tone: '', change: 'Configured workflows', kind: 'normal' },
      ],
      actions: [
        { href: '/admin/management', label: 'Manage admins', className: 'btn btn-danger' },
        { href: '/admin/settings', label: 'Platform settings', className: 'btn btn-primary' },
        { href: '/admin/security/dashboard', label: 'Security center', className: 'btn btn-secondary' },
      ],
      showCharts: true,
    },
  };

  const currentRole = roleConfigs[adminRole] || roleConfigs.admin;

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">
          <Skeleton variant="block" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1>{currentRole.label} Dashboard</h1>
            <p className="admin-subtitle">{currentRole.summary}</p>
          </div>
          <span className="admin-role-badge">{currentRole.label} access</span>
        </div>

        {error && <div className="async-state async-state--error" role="alert">We couldn’t load the dashboard. Please try again.</div>}

        {dashboardStats && (
          <>
            <div className="admin-grid">
              {currentRole.cards.map((card) => (
                <div key={card.label} className={`stat-card ${card.tone || ''} ${card.kind ? card.kind : ''}`}>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
                  <div className={`stat-change ${card.kind === 'danger' ? 'negative' : ''}`}>
                    {card.change}
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-section">
              <h2>Quick Actions</h2>
              <div className="admin-role-actions">
                {currentRole.actions.filter(({ href }) => {
                  if (href === '/admin/users' && isSupport) return false;
                  if (href === '/admin/payments' && !canViewPayments) return false;
                  if (href === '/admin/moderation' && !canModerate) return false;
                  if (href === '/admin/logs' && !canViewAudit) return false;
                  if (href === '/admin/management' && !isSuperAdmin) return false;
                  if (href === '/admin/settings' && !isSuperAdmin) return false;
                  if (href === '/admin/security/dashboard' && !isSuperAdmin) return false;
                  return true;
                }).map(({ href, label, className }) => (
                  <Link key={`${href}-${label}`} to={href} className={className}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {currentRole.showCharts && (
              <>
                <div className="admin-section">
                  <h2>Analytics & Trends</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
                    <UserGrowthChart />
                    <RevenueTrendChart />
                  </div>
                </div>

                <div className="admin-section">
                  <h2>Platform Engagement</h2>
                  <PlatformEngagementMetrics />
                </div>

                <div className="admin-section">
                  <h2>Top Performers</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '20px', marginTop: '20px' }}>
                    <TopHostsTable />
                    <TopClassesTable />
                  </div>
                </div>
              </>
            )}

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

export default AdminDashboard;
