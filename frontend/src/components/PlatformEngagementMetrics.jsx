import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';

const PlatformEngagementMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchEngagementMetrics } = useAdmin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchEngagementMetrics();
        if (response) {
          setMetrics(response);
          setError(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchEngagementMetrics]);

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Active Users</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196F3' }}>{metrics?.activeUsers || 0}</div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Active Classes</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4CAF50' }}>{metrics?.activeClasses || 0}</div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Avg Students/Class</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF9800' }}>{metrics?.avgStudentsPerClass || 0}</div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Total Enrollments</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9C27B0' }}>{metrics?.totalEnrollments || 0}</div>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Engagement Rate</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F44336' }}>{metrics?.engagementRate || 0}%</div>
      </div>
    </div>
  );
};

export default PlatformEngagementMetrics;
