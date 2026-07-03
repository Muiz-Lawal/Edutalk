import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/Points.css';

export default function PointsHistoryPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchPoints();
  }, [user]);

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const bRes = await api.get(`/points/balance/${user._id}`);
      setBalance(bRes.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch points balance', err);
    }

    try {
      const hRes = await api.get(`/points/history/${user._id}`);
      setHistory(hRes.data.history || []);
    } catch (err) {
      console.error('Failed to fetch points history', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading points...</div>;

  return (
    <div className="points-page container">
      <h1>Points</h1>
      <div className="points-summary">
        <div className="points-card">
          <div className="points-value">{balance}</div>
          <div className="points-label">Total Points</div>
        </div>
      </div>

      <div className="points-history">
        <h2>History</h2>
        {history.length === 0 ? (
          <p>No points activity yet.</p>
        ) : (
          <table className="points-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h._id}>
                  <td>{new Date(h.createdAt).toLocaleString()}</td>
                  <td>{h.type}</td>
                  <td>{h.amount > 0 ? `+${h.amount}` : h.amount}</td>
                  <td>{h.description || h.metadata?.reason || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
