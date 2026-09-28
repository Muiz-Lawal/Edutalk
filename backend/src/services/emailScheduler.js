import cron from 'node-cron';
import { createNotification } from '../controllers/notificationController.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';
import VideoRoom from '../models/VideoRoom.js';
import { dispatch, getEmailRetryDelayMs, sendTransactionalJob } from '../lib/notifications.js';

class EmailScheduler {
  constructor() {
    this.jobs = [];
    this.initializeJobs();
  }

  initializeJobs() {
    // Session reminders - every 5 minutes
    this.scheduleSessionReminders();
    this.scheduleNoShowAlerts();

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
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        const now = new Date();
        const marks = [
          { mark: '24h', start: new Date(now.getTime() + 24 * 60 * 60 * 1000), end: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 5 * 60 * 1000) },
          { mark: '1h', start: new Date(now.getTime() + 60 * 60 * 1000), end: new Date(now.getTime() + 60 * 60 * 1000 + 5 * 60 * 1000) },
        ];
        for (const { mark, start, end } of marks) {
          const upcomingSessions = await Session.find({
            scheduledStartTime: { $gte: start, $lt: end },
          status: 'scheduled',
          }).populate({ path: 'classId', select: 'title hostId timezone hostDisplayName', populate: { path: 'hostId', select: 'firstName lastName email timezone' } });

          const studentBatches = new Map();
          for (const session of upcomingSessions) {
            if (!session.classId) continue;
            const subscriptions = await Subscription.find({
              classId: session.classId._id,
              startDate: { $lte: session.scheduledStartTime },
              endDate: { $gte: session.scheduledStartTime },
              status: 'active',
            }).populate('userId', 'email firstName timezone emailPreferences');
            for (const subscription of subscriptions) {
              const user = subscription.userId;
              if (!user) continue;
              const batch = studentBatches.get(String(user._id)) || { user, sessions: [] };
              batch.sessions.push({
                sessionId: String(session._id),
                classId: String(session.classId._id),
                classTitle: session.classId.title,
                scheduledStartTime: session.scheduledStartTime,
                hostName: session.classId.hostDisplayName || `${session.classId.hostId?.firstName || ''} ${session.classId.hostId?.lastName || ''}`.trim(),
              });
              studentBatches.set(String(user._id), batch);
            }

            if (mark === '1h') {
              const host = session.classId.hostId;
              if (host) {
                const rosterSize = await Subscription.countDocuments({
                  classId: session.classId._id,
                  startDate: { $lte: session.scheduledStartTime },
                  endDate: { $gte: session.scheduledStartTime },
                  status: 'active',
                });
                const room = await VideoRoom.findOne({ sessionId: session._id }).select('coHosts');
                const reminderRecipients = [host, ...(room?.coHosts || [])];
                for (const recipient of reminderRecipients) {
                  const hostUser = recipient?.email ? recipient : await User.findById(recipient).select('email firstName timezone');
                  if (hostUser) await dispatch(hostUser, 'host_session_reminder', {
                    entityId: String(session._id),
                    sessionId: String(session._id),
                    classTitle: session.classId.title,
                    scheduledStartTime: session.scheduledStartTime,
                    rosterSize,
                    timezone: hostUser.timezone || session.classId.timezone || 'UTC',
                  });
                }
              }
            }
          }

          for (const { user, sessions } of studentBatches.values()) {
            const sessionIds = sessions.map(({ sessionId }) => sessionId).sort();
            await dispatch(user, 'student_session_reminder', {
              entityId: `${mark}:${sessionIds.join(',')}`,
              digest: mark === '24h' && sessions.length > 1,
              mark,
              sessions,
              classTitle: sessions[0]?.classTitle,
              timezone: user.timezone || 'UTC',
            });
          }
        }
      } catch (error) {
        console.error('[email] session reminder scheduler failed:', error?.message || 'unknown error');
      }
    });

    this.jobs.push(job);
  }

  scheduleNoShowAlerts() {
    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        const now = new Date();
        const earliestEnd = new Date(now.getTime() - 35 * 60000);
        const latestEnd = new Date(now.getTime() - 30 * 60000);
        const completed = await Session.find({
          status: 'completed',
          $or: [
            { actualEndTime: { $gte: earliestEnd, $lte: latestEnd } },
            { actualEndTime: null, scheduledEndTime: { $gte: earliestEnd, $lte: latestEnd } },
          ],
        }).populate({ path: 'classId', select: 'title hostId timezone', populate: { path: 'hostId', select: 'email firstName timezone' } });
        for (const session of completed) {
          const enrolledCount = await Subscription.countDocuments({
            classId: session.classId?._id,
            startDate: { $lte: session.scheduledStartTime },
            endDate: { $gte: session.scheduledStartTime },
            status: 'active',
          });
          if (!enrolledCount || !session.classId?.hostId) continue;
          const hostId = String(session.classId.hostId._id || session.classId.hostId);
          const attendedUsers = new Set((session.attendees || [])
            .filter((attendee) => attendee.userId)
            .map((attendee) => String(attendee.userId))
            .filter((userId) => userId !== hostId));
          const attendedCount = attendedUsers.size;
          if (attendedCount / enrolledCount >= 0.5) continue;
          await dispatch(session.classId.hostId, 'no_show_alert', {
            entityId: String(session._id),
            sessionId: String(session._id),
            classTitle: session.classId.title,
            attendedCount,
            enrolledCount,
          });
        }
      } catch (error) {
        console.error('[email] no-show scheduler failed:', error?.message || 'unknown error');
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
        const pending = await EmailJobModel.find({
          status: 'pending',
          attempts: { $lt: 4 },
          $or: [{ scheduledAt: { $lte: new Date() } }, { scheduledAt: { $exists: false } }],
        }).limit(20).sort({ scheduledAt: 1, createdAt: 1 });
        for (const j of pending) {
          try {
            const currentDateKey = new Date().toISOString().slice(0, 10);
            if (j.userId && j.entityId && j.quotaDate !== currentDateKey) {
              const { default: UserModel } = await import('../models/User.js');
              const user = await UserModel.findById(j.userId).select('email');
              if (!user) throw new Error('Email recipient is unavailable');
              j.quotaDate = null;
              const { dispatch } = await import('../lib/notifications.js');
              const scheduled = await dispatch(user, j.template, { ...j.data, entityId: j.entityId });
              if (scheduled.job && new Date(scheduled.job.scheduledAt) > new Date()) continue;
            }
            const claimed = await EmailJobModel.findOneAndUpdate(
              { _id: j._id, status: 'pending' },
              { $set: { status: 'sending' }, $inc: { attempts: 1 } },
              { new: true },
            );
            if (!claimed) continue;
            if (claimed.userId && claimed.entityId) {
              const { default: UserModel } = await import('../models/User.js');
              const user = await UserModel.findById(claimed.userId).select('emailPreferences');
              const preference = {
                student_session_reminder: 'sessionReminders',
                host_session_reminder: 'sessionReminders',
                recording_ready: 'recordingReady',
                new_enrollment: 'newEnrollment',
              }[claimed.template];
              if (preference && user?.emailPreferences?.[preference] === false) {
                claimed.status = 'suppressed';
                claimed.lastError = null;
                await claimed.save();
                continue;
              }
              await sendTransactionalJob(claimed);
            } else {
              const { sendEmail } = await import('../utils/email.js');
              await sendEmail({ to: claimed.to, subject: claimed.subject, template: claimed.template, data: claimed.data || {}, body: claimed.body });
            }

            claimed.status = 'sent';
            claimed.sentAt = new Date();
            claimed.lastError = null;
            await claimed.save();
          } catch (err) {
            console.warn('[email] queued message delivery failed');
            const failedJob = await EmailJobModel.findById(j._id);
            if (!failedJob) continue;
            failedJob.lastError = String(err?.message || 'Delivery failed').slice(0, 500);
            if (failedJob.attempts >= 4) {
              failedJob.status = 'failed';
            } else {
              failedJob.status = 'pending';
              failedJob.scheduledAt = new Date(Date.now() + getEmailRetryDelayMs(failedJob.attempts));
            }
            await failedJob.save();
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