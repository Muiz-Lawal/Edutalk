import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAdmin } from '../context/AdminContext';
import { Skeleton } from './AsyncBoundary';

const RevenueTrendChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchRevenueTrend } = useAdmin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchRevenueTrend();
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
  }, [fetchRevenueTrend]);

  if (loading) return <Skeleton variant="block" />;
  if (error) return <div className="async-state async-state--error" role="alert"><strong>We couldn’t load revenue trends</strong><p>Please try again.</p></div>;
  if (data.length === 0) return <div className="async-state async-state--empty">Revenue data will appear after transactions.</div>;

  return (
    <div className="chart-card">
      <h3>Revenue Trend (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
          <Legend />
          <Bar 
            dataKey="revenue" 
            fill="#82ca9d" 
            name="Daily Revenue"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueTrendChart;
