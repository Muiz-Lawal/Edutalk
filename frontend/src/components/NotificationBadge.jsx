import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/NotificationBadge.css';
import { Link } from 'react-router-dom';
import { Bell, Check, CircleAlert, CircleCheck, Clock3, Gift, Megaphone, Mail, RefreshCw, ShieldAlert, Star, Target, Trophy, Video, X } from 'lucide-react';

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
      payment_confirmation: CircleCheck,
      session_reminder: Clock3,
      subscription_expiry: CircleAlert,
      auto_renewal: RefreshCw,
      renewal_failed: X,
      host_no_show: CircleAlert,
      refund_confirmation: CircleCheck,
      class_cancellation: ShieldAlert,
      plan_upgrade: Star,
      referral_reward: Gift,
      waitlist_available: Target,
      new_review: Star,
      class_announcement: Megaphone,
      recording_ready: Video,
      achievement_unlocked: Trophy,
    };
    const Icon = icons[type] || Mail;
    return <Icon size={16} strokeWidth={2} aria-hidden="true" />;
  };

  return (
    <div className="notification-badge">
      <button
        className="bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell size={18} strokeWidth={2} aria-hidden="true" />
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
                      <Check size={16} strokeWidth={2} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <p>All caught up!</p>
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
