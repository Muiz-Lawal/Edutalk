import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';
import MessageBanner from '../components/MessageBanner';
import '../styles/Points.css';

export default function PointsHistoryPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id || user?.userId;
    if (!user || !userId || user.isAdmin) {
      setLoading(false);
      setBalance(0);
      setHistory([]);
      return;
    }
    fetchPoints();
  }, [user]);

  const fetchPoints = async () => {
    const userId = user?._id || user?.id || user?.userId;
    if (!userId || user?.isAdmin) {
      setBalance(0);
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bRes = await api.get(`/points/balance/${userId}`);
      setBalance(bRes.data.balance ?? bRes.data.data?.balance ?? 0);
    } catch (err) {
      console.error('Failed to fetch points balance', err);
      setError('Failed to load your points balance. Please try again.');
    }

    try {
      const hRes = await api.get(`/points/history/${userId}`);
      setHistory(hRes.data.history || hRes.data.data?.history || []);
    } catch (err) {
      console.error('Failed to fetch points history', err);
      setError('Failed to load points history. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage={true} message="Loading points..." />;

  return (
    <div className="points-page container">
      {error && (
        <MessageBanner
          type="error"
          title="Points failed to load"
          message={error}
          onClose={() => setError(null)}
        />
      )}
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
