import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/Points.css';
import { Award, BookOpen, CalendarDays, Check, Flame, GraduationCap, HeartHandshake, MessageCircle, Brain, Rocket, Sparkles, Trophy, Zap, Target } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import StatCard from '../components/ui/StatCard';

export default function PointsHistoryPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const normalized = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const waysToEarn = [
    [Rocket, 'First Step', 'Attend your 1st session', 10], [BookOpen, 'Committed Learner', 'Attend 10 sessions', 30],
    [GraduationCap, 'Course Master', 'Finish a course', 50], [Target, 'Perfect Score', 'Score 100% on a quiz', 25],
    [Flame, 'Streak Master', 'Attend 7 sessions in a row', 40], [Trophy, 'Top Performer', 'Rank in the top 5 of a class', 60],
    [Zap, 'Speed Runner', 'Complete a course quickly', 50], [MessageCircle, 'Engagement Champion', 'Participate actively in class', 35],
    [HeartHandshake, 'Community Helper', 'Help a fellow learner', 30], [CalendarDays, 'Consistent Learner', 'Keep learning consistently', 45],
    [Brain, 'Quiz Master', 'Master your class quizzes', 55], [Sparkles, 'Lifetime Learner', 'Reach a lifelong learning milestone', 80],
  ];

  useEffect(() => {
    if (!user || user.isAdmin) {
      // Admins do not have points — avoid backend calls
      setLoading(false);
      setBalance(0);
      setHistory([]);
      return;
    }
    fetchPoints();
  }, [user]);

  const fetchPoints = async () => {
    setLoading(true);
    const userId = user?._id || user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    try {
      const bRes = await api.get(`/points/balance/${userId}`);
      setBalance(bRes.data.balance || 0);
    } catch (err) {
      console.error('Failed to fetch points balance', err);
    }

    try {
      const hRes = await api.get(`/points/history/${userId}`);
      setHistory(hRes.data.history || []);
    } catch (err) {
      console.error('Failed to fetch points history', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="async-skeleton async-skeleton--list" aria-hidden="true" />;

  return (
    <div className="points-page container">
      <div className="page-header">
        <div><p className="eyebrow">Learning rewards</p><h1>Points</h1><p className="page-subtitle">Build momentum and unlock rewards as you learn.</p></div>
        <Badge variant="primary"><Award size={14} /> Rewards program</Badge>
      </div>
      <div className="points-summary dashboard-stats">
        <StatCard label="Total points" value={balance} />
      </div>

      <Card title="Points history" subtitle="Your latest learning activity" className="points-history">
        {history.length === 0 ? (
          <EmptyState icon={Award} title="No points yet" description="Attend your first session to start earning points." />
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
      </Card>
      <section className="points-earn ui-card">
        <h2>Ways to Earn</h2>
        <div className="points-earn-grid">
          {waysToEarn.map(([Icon, name, requirement, amount]) => (
            <article className={`points-earn-card ${history.some((item) => normalized(item.type) === normalized(name) || normalized(item.description).includes(normalized(name))) ? 'unlocked' : 'locked'}`} key={name}>
              <span className="points-earn-icon"><Icon size={20} /></span>
              <div><h3>{name}</h3><p>{requirement}</p></div>
              <span className="points-chip">+{amount} pts</span>
              <span className="points-state">{history.some((item) => normalized(item.type) === normalized(name) || normalized(item.description).includes(normalized(name))) ? <><Check size={14} /> Unlocked</> : 'Keep learning'}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
