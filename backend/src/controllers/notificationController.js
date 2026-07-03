import Notification from '../models/Notification.js';
import User from '../models/User.js';
import EmailJob from '../models/EmailJob.js';
import { sendEmail } from '../utils/email.js';

export const createNotification = async (userId, type, data) => {
  try {
    const notification = new Notification({
      userId,
      type,
      title: getNotificationTitle(type, data),
      message: getNotificationMessage(type, data),
      relatedClassId: data.classId,
      relatedUserId: data.userId,
      relatedPaymentId: data.paymentId,
      metadata: data.metadata || {},
    });

    await notification.save();

    // Enqueue email job if enabled
    const user = await User.findById(userId).select('email emailPreferences firstName');
    if (user && shouldSendEmail(type) && user.email && user.emailPreferences?.[type] !== false) {
      try {
        const subject = notification.title;
        const body = notification.message;
        const job = new EmailJob({
          to: user.email,
          subject,
          body,
          template: type,
          data: { ...data, userName: user.firstName },
          status: 'pending',
        });
        await job.save();
      } catch (jobErr) {
        console.warn('Failed to enqueue email job:', jobErr.message);
      }
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { skip = 0, limit = 20, unreadOnly = false } = req.query;

    let filter = { userId: req.user.userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }

    const notifications = await Notification.find(filter)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(filter);

    res.json({
      notifications,
      total,
      unreadCount: await Notification.countDocuments({ userId: req.user.userId, read: false }),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        read: true,
        readAt: new Date(),
      },
      { new: true }
    );

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    await Notification.findByIdAndDelete(notificationId);

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function getNotificationTitle(type, data) {
  const titles = {
    payment_confirmation: 'Payment Confirmed',
    session_reminder: 'Session Starting Soon',
    subscription_expiry: 'Subscription Expiring',
    auto_renewal: 'Auto-Renewal Processed',
    renewal_failed: 'Renewal Failed',
    host_no_show: 'Class Did Not Start',
    refund_confirmation: 'Refund Processed',
    class_cancellation: 'Class Cancelled',
    plan_upgrade: 'Plan Upgraded',
    referral_reward: 'Referral Reward',
    waitlist_available: 'Spot Available',
    new_review: 'New Review Received',
    class_announcement: 'Class Announcement',
    recording_ready: 'Recording Available',
    achievement_unlocked: 'Achievement Unlocked!',
  };
  return titles[type] || 'Notification';
}

function getNotificationMessage(type, data) {
  switch (type) {
    case 'payment_confirmation':
      return `Your payment of $${data.amount} has been confirmed. Access code: ${data.accessCode}`;
    case 'session_reminder':
      return `Your class starts in ${data.minutesUntilStart} minutes`;
    case 'subscription_expiry':
      return `Your subscription expires in ${data.daysUntilExpiry} days`;
    case 'auto_renewal':
      return `Your subscription has been automatically renewed for ${data.days} days`;
    case 'renewal_failed':
      return 'Your subscription renewal failed. Please update your payment method.';
    case 'host_no_show':
      return 'The host did not start this session. A refund is being processed.';
    case 'refund_confirmation':
      return `A refund of $${data.amount} has been processed to your account`;
    case 'class_cancellation':
      return 'The class has been cancelled. A full refund has been issued.';
    case 'plan_upgrade':
      return `Congratulations! You've been upgraded to ${data.planTier} tier`;
    case 'referral_reward':
      return `You've earned ${data.reward} days free from your referral`;
    case 'waitlist_available':
      return 'A spot is available in the class you are waitlisted for!';
    case 'new_review':
      return `You received a new ${data.rating}-star review`;
    case 'class_announcement':
      return data.message;
    case 'recording_ready':
      return `The recording for "${data.className}" is now available`;
    default:
      return 'You have a new notification';
  }
}

function shouldSendEmail(type) {
  const emailTypes = [
    'payment_confirmation',
    'session_reminder',
    'subscription_expiry',
    'auto_renewal',
    'renewal_failed',
    'refund_confirmation',
    'class_cancellation',
    'new_review',
    'recording_ready',
    'achievement_unlocked',
    'moderation_rejected',
    'appeal_decision',
  ];
  return emailTypes.includes(type);
}
