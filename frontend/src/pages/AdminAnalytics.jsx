import React from 'react';
import { AdminLayout } from '../components/AdminLayout';
import '../styles/admin.css';

export const AdminAnalytics = () => {
  return (
    <AdminLayout>
      <div className="admin-page">
        <h1>Analytics</h1>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
          <p>Advanced analytics dashboard coming soon...</p>
          <p>Features:</p>
          <ul>
            <li>User growth trends</li>
            <li>Revenue analytics</li>
            <li>Top hosts and classes</li>
            <li>Engagement metrics</li>
            <li>Geographic distribution</li>
            <li>Device analytics</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};
