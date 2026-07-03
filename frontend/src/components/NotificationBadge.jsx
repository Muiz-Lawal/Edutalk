import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/NotificationBadge.css';
import { Link } from 'react-router-dom';

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=5');
      setUnreadCount(response.data.unreadCount);
      setRecentNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      payment_confirmation: '✅',
      session_reminder: '⏰',
      subscription_expiry: '⚠️',
      auto_renewal: '🔄',
      renewal_failed: '❌',
      host_no_show: '😞',
      refund_confirmation: '💰',
      class_cancellation: '🚫',
      plan_upgrade: '⭐',
      referral_reward: '🎁',
      waitlist_available: '🎯',
      new_review: '⭐',
      class_announcement: '📢',
      recording_ready: '🎥',
      achievement_unlocked: '🏅',
    };
    return icons[type] || '📬';
  };

  return (
    <div className="notification-badge">
      <button
        className="bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <span className="unread-count">{unreadCount} new</span>
            )}
          </div>

          <div className="notification-list">
            {recentNotifications.length > 0 ? (
              recentNotifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${!notif.read ? 'unread' : ''} ${notif.type === 'achievement_unlocked' ? 'achievement' : ''}`}
                >
                  <span className="notif-icon">
                    {getNotificationIcon(notif.type)}
                  </span>
                  <div className="notif-content">
                    <div className="notif-title">{notif.title}</div>
                    <div className="notif-message">{notif.message}</div>
                    {notif.type === 'achievement_unlocked' && notif.metadata && (
                      <div className="notif-achievement">
                        <span className="achievement-points">+{notif.metadata.points || 0} pts</span>
                        <Link to="/achievements" className="view-achievement-link">View Achievement</Link>
                      </div>
                    )}
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="mark-read-btn"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <p>📭 All caught up!</p>
              </div>
            )}
          </div>

          <Link to="/notifications" className="view-all-btn">
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
