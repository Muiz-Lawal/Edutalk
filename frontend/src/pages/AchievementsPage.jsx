import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import AchievementBadge from '../components/AchievementBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/AchievementsPage.css';
import { useAuth } from '../hooks/useAuth';

const AchievementsPage = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pointsBalance, setPointsBalance] = useState(0);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        setError(null);

        const [myResponse, badgesResponse] = await Promise.all([
          api.get('/achievements/my-achievements'),
          api.get('/achievements/badges/all'),
        ]);

        setAchievements(myResponse.data.data.achievements || []);
        setGrouped(myResponse.data.data.grouped || {});
        setBadges(badgesResponse.data.data || []);

        // Fetch points balance for current user
        try {
          const uid = user?.id || user?.userId || '';
          const balanceRes = await api.get(`/points/balance/${uid}`);
          setPointsBalance(balanceRes.data?.data?.balance ?? 0);
        } catch (balanceErr) {
          console.warn('Failed to fetch points balance:', balanceErr.message || balanceErr);
        }
      } catch (err) {
        console.error('Failed to load achievements:', err);
        setError(err.response?.data?.message || err.message || 'Unable to load achievements.');
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [user]);

  const totalEarned = achievements.length;
  const unlockedTypes = Object.keys(grouped).length;
  const availableBadges = badges.length;

  if (loading) {
    return (
      <div className="achievements-page">
        <LoadingSpinner fullPage={true} message="Loading your achievements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements-page">
        <div className="achievements-page__error">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <div className="achievements-page__header">
        <h1>My Achievements</h1>
        <p>Track your badges, milestones, and leaderboard progress across classes.</p>
      </div>

      <div className="achievements-page__summary">
        <div className="summary-card">
          <span className="summary-card__value">{totalEarned}</span>
          <span className="summary-card__label">Achievements Earned</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__value">{unlockedTypes}</span>
          <span className="summary-card__label">Badge Types Unlocked</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__value">{availableBadges}</span>
          <span className="summary-card__label">Available Badges</span>
        </div>
        <div className="summary-card">
          <span className="summary-card__value">{pointsBalance}</span>
          <span className="summary-card__label">Total Points</span>
        </div>
      </div>

      <section className="achievements-page__section">
        <div className="achievements-page__section-header">
          <h2>Unlocked Achievements</h2>
          <p>Celebrate your progress and see what you've earned so far.</p>
        </div>

        {achievements.length === 0 ? (
          <div className="achievements-page__empty">
            <p>You haven’t unlocked any achievements yet. Keep learning to earn badges!</p>
          </div>
        ) : (
          <div className="achievements-page__badges-grid">
            {achievements.map((achievement, index) => (
              <div key={`${achievement.type}-${index}`} className="achievements-page__badge-card">
                <AchievementBadge achievement={achievement} size="large" showLabel />
                <div className="achievement-card__details">
                  <h3>{achievement.name}</h3>
                  <p>{achievement.description}</p>
                  {achievement.awardedAt && (
                    <span>Unlocked on {new Date(achievement.awardedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="achievements-page__section achievements-page__badge-library">
        <div className="achievements-page__section-header">
          <h2>Badge Gallery</h2>
          <p>Browse all available achievements and what you can unlock next.</p>
        </div>

        <div className="achievements-page__badge-catalog">
          {badges.map((badge) => (
            <div key={badge.type} className="achievements-page__badge-card achievement-card--available">
              <AchievementBadge achievement={{ ...badge, unlocked: false }} size="medium" showLabel />
              <div className="achievement-card__details">
                <h3>{badge.name}</h3>
                <p>{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AchievementsPage;
