import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import '../styles/Notifications.css';
import { Link } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=20');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
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

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
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

  if (loading) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="container">
        <div className="notifications-header">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <div className="unread-badge">{unreadCount} unread</div>
          )}
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="btn btn-secondary">
              Mark all as read
            </button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="notifications-list">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="notification-content">
                  <div className="notification-title">
                    {notif.title}
                  </div>
                  <div className="notification-message">
                    {notif.message}
                  </div>
                  {notif.type === 'achievement_unlocked' && notif.metadata && (
                    <div className="notification-achievement">
                      <strong>Points:</strong> +{notif.metadata.points || 0}
                      {notif.metadata.achievementId && (
                        <Link to="/achievements" className="view-achievement-link"> View</Link>
                      )}
                    </div>
                  )}
                  <div className="notification-time">
                    {new Date(notif.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="notification-actions">
                  {!notif.read && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="action-btn"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notif._id)}
                    className="action-btn delete"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-notifications">
            <p>📭 No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
