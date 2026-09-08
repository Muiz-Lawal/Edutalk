import React, { useEffect, useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Skeleton } from './AsyncBoundary';

const TopHostsTable = () => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchTopHosts } = useAdmin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchTopHosts();
        if (response) {
          setHosts(response);
          setError(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchTopHosts]);

  if (loading) return <Skeleton variant="list" />;
  if (error) return <div className="async-state async-state--error" role="alert"><strong>We couldn’t load host performance</strong><p>Please try again.</p></div>;

  return (
    <div className="table-card">
      <h3>Top Hosts by Revenue</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Host Name</th>
            <th>Email</th>
            <th>Classes</th>
            <th>Students</th>
            <th>Revenue</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {hosts.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                No hosts found
              </td>
            </tr>
          ) : (
            hosts.map((host) => (
              <tr key={host._id}>
                <td>{host.firstName} {host.lastName}</td>
                <td>{host.email}</td>
                <td>{host.classCount}</td>
                <td>{host.studentCount || 0}</td>
                <td>${(host.revenue || 0).toFixed(2)}</td>
                <td>{host.rating ? host.rating.toFixed(1) : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TopHostsTable;
