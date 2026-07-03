import cron from 'node-cron';
import { createNotification } from '../controllers/notificationController.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';

class EmailScheduler {
  constructor() {
    this.jobs = [];
    this.initializeJobs();
  }

  initializeJobs() {
    // Session reminders - every 5 minutes
    this.scheduleSessionReminders();

    // Subscription expiry warnings - daily at 9 AM
    this.scheduleExpiryWarnings();

    // Payment failure notifications - daily at 10 AM
    this.schedulePaymentFailureNotifications();

    // Recording availability notifications - every 15 minutes
    this.scheduleRecordingNotifications();

    // Email queue processor - short interval to flush queued messages
    this.scheduleEmailQueueProcessor();

    // Badge engine runner - award badges periodically
    this.scheduleBadgeEngine();

    console.log('Email scheduler initialized with', this.jobs.length, 'jobs');
  }

  scheduleSessionReminders() {
    // Check every 5 minutes for upcoming sessions
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        const now = new Date();
        const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
        const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

        // Find sessions starting in 15 or 30 minutes
        const upcomingSessions = await Session.find({
          scheduledStartTime: {
            $gte: fifteenMinutesFromNow,
            $lte: thirtyMinutesFromNow,
          },
          status: 'scheduled',
        }).populate('classId', 'title hostId');

        for (const session of upcomingSessions) {
          const minutesUntilStart = Math.round(
            (session.scheduledStartTime - now) / (1000 * 60)
          );

          // Find all subscribers for this class
          const subscriptions = await Subscription.find({
            classId: session.classId._id,
            startDate: { $lte: now },
            endDate: { $gte: now },
            status: 'active',
          }).populate('userId', 'email emailPreferences');

          for (const subscription of subscriptions) {
            const user = subscription.userId;

            // Check if user wants session reminders
            if (user.emailPreferences?.sessionReminders !== false) {
              await createNotification(user._id, 'session_reminder', {
                classId: session.classId._id,
                className: session.classId.title,
                sessionId: session._id,
                minutesUntilStart,
                sessionUrl: `${process.env.FRONTEND_URL}/video/${session.roomId}`,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in session reminder job:', error);
      }
    });

    this.jobs.push(job);
  }

  scheduleExpiryWarnings() {
    // Daily at 9 AM
    const job = cron.schedule('0 9 * * *', async () => {
      try {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

        // Find subscriptions expiring in 7, 3, or 1 days
        const expiringSubscriptions = await Subscription.find({
          endDate: {
            $gte: oneDayFromNow,
            $lte: sevenDaysFromNow,
          },
          status: 'active',
        }).populate('userId', 'email emailPreferences').populate('classId', 'title');

        for (const subscription of expiringSubscriptions) {
          const user = subscription.userId;
          const daysUntilExpiry = Math.ceil(
            (subscription.endDate - now) / (1000 * 60 * 60 * 24)
          );

          // Check if user wants expiry warnings
          if (user.emailPreferences?.subscriptionExpiry !== false) {
            await createNotification(user._id, 'subscription_expiry', {
              classId: subscription.classId._id,
              className: subscription.classId.title,
              daysUntilExpiry,
              renewalUrl: `${process.env.FRONTEND_URL}/class/${subscription.classId._id}`,
            });
          }
        }
      } catch (error) {
        console.error('Error in expiry warning job:', error);
      }
    });

    this.jobs.push(job);
  }

  schedulePaymentFailureNotifications() {
    // Daily at 10 AM
    const job = cron.schedule('0 10 * * *', async () => {
      try {
        // Find failed payments from the last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // This would need to be implemented based on your payment model
        // For now, we'll create a placeholder
        console.log('Checking for failed payments...');

        // TODO: Implement failed payment detection and notifications
      } catch (error) {
        console.error('Error in payment failure job:', error);
      }
    });

    this.jobs.push(job);
  }

  scheduleRecordingNotifications() {
    // Every 15 minutes
    const job = cron.schedule('*/15 * * * *', async () => {
      try {
        // Find recordings that became available in the last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        // This would need to be implemented based on your recording model
        // For now, we'll create a placeholder
        console.log('Checking for new recordings...');

        // TODO: Implement recording availability notifications
      } catch (error) {
        console.error('Error in recording notification job:', error);
      }
    });

    this.jobs.push(job);
  }

  scheduleEmailQueueProcessor() {
    // Run every minute
    const job = cron.schedule('*/1 * * * *', async () => {
      try {
        const EmailJob = await import('../models/EmailJob.js');
        const { default: EmailJobModel } = EmailJob;
        const { sendEmail } = await import('../utils/email.js');

        // Find pending jobs with less than 5 attempts
        const pending = await EmailJobModel.find({ status: 'pending', attempts: { $lt: 5 } }).limit(20).sort({ createdAt: 1 });
        for (const j of pending) {
          try {
            j.status = 'sending';
            j.attempts = (j.attempts || 0) + 1;
            await j.save();

            // Attempt send
            await sendEmail(j.to, j.subject, j.body, j.template || '', j.data || {});

            j.status = 'sent';
            j.sentAt = new Date();
            await j.save();
          } catch (err) {
            console.warn('Email job send failed:', err.message || err);
            j.status = 'failed';
            j.lastError = err.message || String(err);
            await j.save();
          }
        }
      } catch (err) {
        console.error('Error processing email queue:', err);
      }
    });

    this.jobs.push(job);
  }

  scheduleBadgeEngine() {
    // Run every 5 minutes
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        const { runBadgeEngine } = await import('./badgeEngine.js');
        await runBadgeEngine();
      } catch (err) {
        console.error('Error running badge engine:', err);
      }
    });

    this.jobs.push(job);
  }

  // Method to send immediate notifications (not scheduled)
  async sendImmediateNotification(userId, type, data) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Check user preferences
      if (!this.shouldSendEmail(user, type)) return;

      await createNotification(userId, type, data);
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  shouldSendEmail(user, type) {
    if (!user.emailPreferences) return true; // Default to sending if no preferences set

    const preferences = user.emailPreferences;

    switch (type) {
      case 'payment_confirmation':
        return preferences.paymentConfirmations !== false;
      case 'session_reminder':
        return preferences.sessionReminders !== false;
      case 'subscription_expiry':
        return preferences.subscriptionExpiry !== false;
      case 'refund_confirmation':
        return preferences.refundNotifications !== false;
      case 'class_announcement':
        return preferences.announcements !== false;
      case 'recording_ready':
        return preferences.recordingNotifications !== false;
      default:
        return true;
    }
  }

  stopAllJobs() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
  }
}

export default new EmailScheduler();