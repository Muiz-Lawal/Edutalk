import cron from 'node-cron';
import StreamSchedule from '../models/StreamSchedule.js';
import StreamNotification from '../models/StreamNotification.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import emailTemplateService from './scheduleEmailTemplateService.js';
import emailService from './emailService.js';
import io from '../socket.js'; // Assuming socket.io is initialized in a socket.js file

let schedulerJob = null;

/**
 * Start the notification scheduler
 * Runs every 5 minutes to check for due reminders
 */
const startNotificationScheduler = () => {
  console.log('Starting schedule notification scheduler...');

  // Run every 5 minutes
  schedulerJob = cron.schedule('*/5 * * * *', async () => {
    try {
      await checkAndSendReminders();
    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  });

  console.log('Schedule notification scheduler started ✓');
};

/**
 * Check for schedules due for reminders and send them
 */
const checkAndSendReminders = async () => {
  try {
    // Find all scheduled streams
    const schedules = await StreamSchedule.find({ status: 'scheduled' }).populate('hostId classId');

    const now = new Date();

    for (const schedule of schedules) {
      // Reminder times: 1440 mins (24h), 60 mins (1h), 30 mins
      const reminderOffsets = [
        { minutes: 1440, type: '24h' },
        { minutes: 60, type: '1h' },
        { minutes: 30, type: '30m' },
      ];

      for (const offset of reminderOffsets) {
        const reminderTime = new Date(schedule.scheduledStartTime);
        reminderTime.setMinutes(reminderTime.getMinutes() - offset.minutes);

        // Check if we should send this reminder
        const shouldSend = now >= reminderTime && now < new Date(reminderTime.getTime() + 5 * 60 * 1000); // Within 5 minute window

        if (shouldSend) {
          // Check if already sent
          const alreadySent = schedule.notificationsSent && schedule.notificationsSent.includes(new Date(reminderTime).toISOString());

          if (!alreadySent) {
            await sendRemindersForSchedule(schedule, offset.type);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

/**
 * Send reminders to all enrolled students for a schedule
 */
const sendRemindersForSchedule = async (schedule, reminderType) => {
  try {
    // Find all students enrolled in this class
    const subscriptions = await Subscription.find({ classId: schedule.classId });

    for (const subscription of subscriptions) {
      await sendEmailReminder(subscription.userId, schedule, reminderType);
      await createInAppNotification(subscription.userId, schedule, reminderType);
    }

    // Mark reminder as sent
    if (!schedule.notificationsSent) {
      schedule.notificationsSent = [];
    }
    schedule.notificationsSent.push(new Date());
    await schedule.save();

    console.log(`✓ Sent ${reminderType} reminders for schedule ${schedule._id}`);
  } catch (error) {
    console.error(`Error sending reminders for schedule ${schedule._id}:`, error);
  }
};

/**
 * Send email reminder to individual student
 */
const sendEmailReminder = async (userId, schedule, reminderType) => {
  try {
    const user = await User.findById(userId);
    const host = await User.findById(schedule.hostId);

    if (!user || !host) {
      console.warn(`User ${userId} or host not found`);
      return;
    }

    const { subject, html } = emailTemplateService.generateScheduleReminderEmail(
      schedule,
      reminderType,
      user.firstName || user.email,
      host.firstName || host.email
    );

    // Send email (assuming emailService.sendEmail exists)
    await emailService.sendEmail({
      to: user.email,
      subject,
      html,
    });

    // Create notification record
    await StreamNotification.create({
      scheduleId: schedule._id,
      userId,
      type: 'email',
      reminderType,
      message: subject,
      status: 'sent',
      sentAt: new Date(),
    });

    console.log(`✓ Email reminder sent to ${user.email} for schedule ${schedule._id}`);
  } catch (error) {
    console.error(`Error sending email reminder to user ${userId}:`, error);

    // Log failed notification
    await StreamNotification.create({
      scheduleId: schedule._id,
      userId,
      type: 'email',
      reminderType,
      message: `Failed to send ${reminderType} reminder`,
      status: 'failed',
      error: error.message,
    });
  }
};

/**
 * Create in-app notification and emit via Socket.io
 */
const createInAppNotification = async (userId, schedule, reminderType) => {
  try {
    let notificationText = '';

    switch (reminderType) {
      case '24h':
        notificationText = `Your class "${schedule.title}" starts tomorrow at ${new Date(schedule.scheduledStartTime).toLocaleTimeString()}`;
        break;
      case '1h':
        notificationText = `Your class "${schedule.title}" starts in 1 hour!`;
        break;
      case '30m':
        notificationText = `Your class "${schedule.title}" starts in 30 minutes!`;
        break;
      default:
        notificationText = `Reminder: "${schedule.title}" is starting soon`;
    }

    // Create notification record
    const notification = await StreamNotification.create({
      scheduleId: schedule._id,
      userId,
      type: 'in-app',
      reminderType,
      message: notificationText,
      status: 'sent',
      sentAt: new Date(),
    });

    // Emit Socket.io event to user (if connected)
    if (io) {
      io.to(`user_${userId}`).emit('notification:reminder', {
        id: notification._id,
        title: `Class Reminder`,
        message: notificationText,
        type: 'schedule-reminder',
        scheduleId: schedule._id,
        timestamp: new Date(),
      });
    }

    console.log(`✓ In-app notification created for user ${userId}`);
  } catch (error) {
    console.error(`Error creating in-app notification for user ${userId}:`, error);
  }
};

/**
 * Stop the notification scheduler
 */
const stopNotificationScheduler = () => {
  if (schedulerJob) {
    schedulerJob.stop();
    console.log('Schedule notification scheduler stopped ✓');
  }
};

export default {
  startNotificationScheduler,
  stopNotificationScheduler,
  checkAndSendReminders,
  sendRemindersForSchedule,
  sendEmailReminder,
  createInAppNotification,
};
