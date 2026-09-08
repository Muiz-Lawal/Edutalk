import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../context/AdminContext';
import { Skeleton } from './AsyncBoundary';

const UserGrowthChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchUserGrowth } = useAdmin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchUserGrowth();
        if (response) {
          setData(response);
          setError(null);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchUserGrowth]);

  if (loading) return <Skeleton variant="block" />;
  if (error) return <div className="async-state async-state--error" role="alert"><strong>We couldn’t load user growth</strong><p>Please try again.</p></div>;
  if (data.length === 0) return <div className="async-state async-state--empty">User growth data will appear as people join.</div>;

  return (
    <div className="chart-card">
      <h3>User Growth (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#8884d8" 
            name="New Users"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default UserGrowthChart;
