import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AchievementBadge from '../components/AchievementBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import '../styles/LeaderboardPage.css';

const LeaderboardPage = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('points'); // points, completion, participation
  const [timeRange, setTimeRange] = useState('all'); // all, month, week

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/achievements/leaderboard/${classId}`, {
          params: {
            sortBy,
          }
        });
        const leaderboardData = response.data?.data || [];

        // normalize entries to support different backend shapes
        const normalized = leaderboardData.map((entry, idx) => ({
          studentId: entry.studentId?._id || entry.studentId || entry.studentId?.toString() || entry._id,
          studentName: entry.name || entry.studentName || (entry.studentId?.firstName ? `${entry.studentId.firstName} ${entry.studentId.lastName}` : 'Unknown'),
          studentEmail: entry.email || entry.studentEmail || entry.studentId?.email || '',
          points: entry.points ?? entry.totalPoints ?? 0,
          unlockedAchievements: entry.totalAchievements || entry.unlockedAchievements || 0,
          topAchievements: entry.achievements || entry.topAchievements || [],
          rank: entry.rank || idx + 1,
          completion: entry.completion || entry.completionRate || 0,
          participation: entry.participation || entry.participationScore || 0,
        }));

        setLeaderboard(normalized);

        // fetch user points balance to show in user rank area
        let userBalance = 0;
        try {
          if (user?.id) {
            const balanceRes = await api.get(`/points/balance/${user.id}`);
            userBalance = balanceRes.data?.data?.balance ?? 0;
          }
        } catch (balErr) {
          console.warn('Failed to fetch user points balance:', balErr.message || balErr);
        }

        if (user?.id) {
          const currentUser = normalized.find(entry => entry.studentId === user.id || String(entry.studentId) === String(user.id));
          if (currentUser) {
            setUserRank({
              ...currentUser,
              points: currentUser.points ?? userBalance,
              rank: currentUser.rank || normalized.findIndex(e => e.studentId === currentUser.studentId) + 1
            });
          } else {
            setUserRank(userBalance ? { studentId: user.id, studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim(), points: userBalance, rank: null } : null);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchLeaderboard();
    }
  }, [classId, sortBy, timeRange, user?.id]);

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <LoadingSpinner fullPage={true} message="Loading leaderboard..." />
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-page__header">
        <h1 className="leaderboard-page__title">Class Leaderboard</h1>
        <p className="leaderboard-page__subtitle">
          Top performers and achievement leaders
        </p>
      </div>

      {error && (
        <div className="leaderboard-page__error">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="leaderboard-page__controls">
        <div className="leaderboard-page__control-group">
          <label className="leaderboard-page__label">Sort By:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="leaderboard-page__select"
          >
            <option value="points">Achievement Points</option>
            <option value="completion">Completion Rate</option>
            <option value="participation">Participation</option>
          </select>
        </div>

        <div className="leaderboard-page__control-group">
          <label className="leaderboard-page__label">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="leaderboard-page__select"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Your Rank */}
      {userRank && (
        <div className="leaderboard-page__user-rank">
          <div className="leaderboard-page__user-rank-content">
            <div className="leaderboard-page__user-rank-medal">
              {getMedalEmoji(userRank.rank)}
            </div>
            <div className="leaderboard-page__user-rank-info">
              <h3 className="leaderboard-page__user-rank-title">Your Position</h3>
              <p className="leaderboard-page__user-rank-text">
                Rank #{userRank.rank} with {userRank.points} points
              </p>
            </div>
            <div className="leaderboard-page__user-rank-progress">
              <div className="leaderboard-page__progress-bar">
                <div
                  className="leaderboard-page__progress-fill"
                  style={{ width: `${(userRank.points / (leaderboard[0]?.points || 1000)) * 100}%` }}
                ></div>
              </div>
              <p className="leaderboard-page__points-to-next">
                {leaderboard[0] && leaderboard[0].points > userRank.points
                  ? `${leaderboard[0].points - userRank.points} points to 1st place`
                  : 'You are #1! 🎉'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="leaderboard-page__table-container">
        <table className="leaderboard-page__table">
          <thead className="leaderboard-page__table-head">
            <tr>
              <th className="leaderboard-page__th leaderboard-page__th--rank">Rank</th>
              <th className="leaderboard-page__th leaderboard-page__th--name">Student</th>
              <th className="leaderboard-page__th leaderboard-page__th--score">
                {sortBy === 'points' ? 'Points' : sortBy === 'completion' ? 'Completion' : 'Participation'}
              </th>
              <th className="leaderboard-page__th leaderboard-page__th--stats">Achievements</th>
              <th className="leaderboard-page__th leaderboard-page__th--badges">Badges</th>
            </tr>
          </thead>
          <tbody className="leaderboard-page__table-body">
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.studentId}
                className={`leaderboard-page__table-row ${
                  entry.studentId === user?.id ? 'leaderboard-page__table-row--current-user' : ''
                } ${index < 3 ? 'leaderboard-page__table-row--top' : ''}`}
              >
                <td className="leaderboard-page__td leaderboard-page__td--rank">
                  <span className="leaderboard-page__rank-badge">
                    {getMedalEmoji(entry.rank)}
                    {entry.rank}
                  </span>
                </td>

                <td className="leaderboard-page__td leaderboard-page__td--name">
                  <div className="leaderboard-page__student-info">
                    <div className="leaderboard-page__student-avatar">
                      {entry.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div className="leaderboard-page__student-details">
                      <h4 className="leaderboard-page__student-name">
                        {entry.studentName}
                        {entry.studentId === user?.id && (
                          <span className="leaderboard-page__you-label">You</span>
                        )}
                      </h4>
                      <p className="leaderboard-page__student-email">{entry.studentEmail}</p>
                    </div>
                  </div>
                </td>

                <td className="leaderboard-page__td leaderboard-page__td--score">
                  <div className="leaderboard-page__score">
                    <span className="leaderboard-page__score-value">
                      {sortBy === 'points'
                        ? entry.points
                        : sortBy === 'completion'
                        ? `${entry.completion ?? entry.completionPercentage ?? 0}%`
                        : `${entry.engagement ?? entry.engagementScore ?? 0}%`}
                    </span>
                    {entry.trend && (
                      <span className={`leaderboard-page__trend ${entry.trend > 0 ? 'leaderboard-page__trend--up' : 'leaderboard-page__trend--down'}`}>
                        {entry.trend > 0 ? '📈' : '📉'} {Math.abs(entry.trend)}
                      </span>
                    )}
                  </div>
                </td>

                <td className="leaderboard-page__td leaderboard-page__td--stats">
                  <div className="leaderboard-page__stats">
                    <span className="leaderboard-page__stat">
                      {entry.unlockedAchievements || 0} achievements
                    </span>
                  </div>
                </td>

                <td className="leaderboard-page__td leaderboard-page__td--badges">
                  <div className="leaderboard-page__badges">
                    {entry.topAchievements?.slice(0, 3).map((achievement, idx) => (
                      <AchievementBadge
                        key={idx}
                        achievement={achievement}
                        size="small"
                        showLabel={false}
                      />
                    ))}
                    {entry.topAchievements?.length > 3 && (
                      <div className="leaderboard-page__badge-more">
                        +{entry.topAchievements.length - 3}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leaderboard Legend */}
      <div className="leaderboard-page__legend">
        <h3 className="leaderboard-page__legend-title">About the Leaderboard</h3>
        <div className="leaderboard-page__legend-items">
          <div className="leaderboard-page__legend-item">
            <span className="leaderboard-page__legend-icon">🏆</span>
            <span>Ranked by achievements, completion, and participation</span>
          </div>
          <div className="leaderboard-page__legend-item">
            <span className="leaderboard-page__legend-icon">📊</span>
            <span>Points earned from completing assignments and achieving milestones</span>
          </div>
          <div className="leaderboard-page__legend-item">
            <span className="leaderboard-page__legend-icon">🎓</span>
            <span>Badges displayed for top 3 recent achievements</span>
          </div>
          <div className="leaderboard-page__legend-item">
            <span className="leaderboard-page__legend-icon">📈</span>
            <span>Trends show rank movement this period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
