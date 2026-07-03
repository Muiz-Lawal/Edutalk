import React, { useState } from 'react';
import '../styles/AchievementBadge.css';

const AchievementBadge = ({ 
  achievement, 
  size = 'medium',
  showLabel = true,
  onClick 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    type = 'unknown',
    title = achievement?.title || achievement?.name || 'Achievement',
    description = achievement?.description || 'Unlock this achievement',
    points = achievement?.points || (achievement?.earnedCount ? achievement.earnedCount * 10 : 0),
    unlocked = achievement?.unlocked ?? Boolean(achievement?.awardedAt),
    unlockedAt = achievement?.unlockedAt || achievement?.awardedAt,
    rarity = achievement?.rarity || 'common', // common, rare, epic, legendary
    badgeColor = achievement?.badgeColor
  } = achievement || {};
  
  const getBadgeIcon = (achievementType) => {
    const icons = {
      first_session: '🚀',
      course_completion: '🎓',
      perfect_score: '⭐',
      quiz_streak: '🔥',
      participation: '💬',
      engagement_champion: '👑',
      early_bird: '🌅',
      consistent_learner: '📚',
      top_performer: '🏆',
      milestone_achiever: '🎯'
    };
    return icons[achievementType] || '🏅';
  };

  const getRarityColor = (rarityLevel) => {
    const colors = {
      common: '#6b7280',
      rare: '#3b82f6',
      epic: '#8b5cf6',
      legendary: '#f59e0b'
    };
    return colors[rarityLevel] || colors.common;
  };

  return (
    <div 
      className={`achievement-badge achievement-badge--${size} achievement-badge--${rarity} ${!unlocked ? 'achievement-badge--locked' : ''}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <div className="achievement-badge__container" style={{ '--badge-color': badgeColor || undefined }}>
        <div className="achievement-badge__icon">
          {getBadgeIcon(type)}
        </div>
        
        {!unlocked && (
          <div className="achievement-badge__lock">
            🔒
          </div>
        )}

        {unlocked && (
          <div className="achievement-badge__glow"></div>
        )}
      </div>

      {showLabel && (
        <div className="achievement-badge__label">
          <p className="achievement-badge__title">{title}</p>
        </div>
      )}

      {showTooltip && (
        <div className="achievement-badge__tooltip">
          <div className="achievement-badge__tooltip-header">
            <span className="achievement-badge__tooltip-title">{title}</span>
            <span className="achievement-badge__tooltip-points">+{points} pts</span>
          </div>
          <p className="achievement-badge__tooltip-description">{description}</p>
          <div className="achievement-badge__tooltip-rarity">
            <span 
              className="achievement-badge__tooltip-rarity-dot"
              style={{ backgroundColor: getRarityColor(rarity) }}
            ></span>
            <span className="achievement-badge__tooltip-rarity-text">
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)} Achievement
            </span>
          </div>
          {unlocked && unlockedAt && (
            <p className="achievement-badge__tooltip-unlocked">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
