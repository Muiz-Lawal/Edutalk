import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminPermissions } from '../hooks/useAdminPermissions';

const tickets = [
  { id: '#ST-1042', user: 'alex@edutalk.io', issue: 'Access code not working', priority: 'Critical', sla: '15 min', status: 'Open' },
  { id: '#ST-1045', user: 'maya@edutalk.io', issue: 'Refund request for a cancelled class', priority: 'High', sla: '4 h', status: 'Escalated' },
  { id: '#ST-1050', user: 'sam@edutalk.io', issue: 'Goodwill credit request', priority: 'Medium', sla: '12 h', status: 'Pending' },
  { id: '#ST-1053', user: 'nora@edutalk.io', issue: 'Login loop on device trust check', priority: 'Critical', sla: '15 min', status: 'Open' },
];

export default function AdminSupport() {
  const { adminRole } = useAdminPermissions();

  return (
    <AdminLayout>
      <div className="admin-page">
        <h1>Support Dashboard</h1>
        <p className="admin-subtitle">{adminRole ? `${adminRole.replace('_', ' ')} workflow` : 'Support workflow'}</p>

        <div className="admin-grid">
          <div className="stat-card">
            <div className="stat-label">Open Tickets</div>
            <div className="stat-value">18</div>
            <div className="stat-change">2 critical</div>
          </div>

          <div className="stat-card success">
            <div className="stat-label">Resolved Today</div>
            <div className="stat-value">11</div>
            <div className="stat-change">87% SLA hit</div>
          </div>

          <div className="stat-card warning">
            <div className="stat-label">Escalations</div>
            <div className="stat-value">4</div>
            <div className="stat-change">Awaiting review</div>
          </div>

          <div className="stat-card danger">
            <div className="stat-label">Goodwill Credits</div>
            <div className="stat-value">7</div>
            <div className="stat-change">Logged this week</div>
          </div>
        </div>

        <div className="admin-section">
          <h2>Ticket Queue</h2>
          <div className="admin-table">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>User</th>
                  <th>Issue</th>
                  <th>Priority</th>
                  <th>SLA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>{ticket.id}</td>
                    <td>{ticket.user}</td>
                    <td>{ticket.issue}</td>
                    <td>{ticket.priority}</td>
                    <td>{ticket.sla}</td>
                    <td><span className="status-badge active">{ticket.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
