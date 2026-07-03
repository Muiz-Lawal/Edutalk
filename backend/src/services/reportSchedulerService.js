// Report Scheduler Service
const cron = require('node-cron');
const ReportSchedule = require('../models/ReportSchedule');
const StreamMetrics = require('../models/StreamMetrics');
const nodemailer = require('nodemailer');
const emailTemplateService = require('./emailTemplateService');

// Initialize email transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

/**
 * Start all scheduled report jobs
 */
exports.startScheduler = async () => {
  console.log('Starting report scheduler...');

  // Check for reports to send every minute
  cron.schedule('* * * * *', async () => {
    await checkAndSendReports();
  });

  // Recalculate next send times daily
  cron.schedule('0 0 * * *', async () => {
    await updateNextSendTimes();
  });

  console.log('Report scheduler started');
};

/**
 * Check and send due reports
 */
const checkAndSendReports = async () => {
  try {
    const now = new Date();

    // Find schedules that are due to send
    const dueSchedules = await ReportSchedule.find({
      isActive: true,
      nextSendAt: { $lte: now },
    });

    for (const schedule of dueSchedules) {
      await sendReport(schedule);
    }
  } catch (error) {
    console.error('Error checking reports:', error);
  }
};

/**
 * Send a single report
 */
const sendReport = async (schedule) => {
  try {
    // Fetch latest analytics for all host's streams
    // (Implementation depends on your analytics structure)

    const metrics = {
      totalViewers: 145,
      peakViewers: 156,
      avgWatchTime: 42.5,
      engagementScore: 78.5,
      totalMessages: 234,
      uniqueChatters: 89,
    };

    // Generate email
    const emailHtml = emailTemplateService.generateEmailTemplate(
      {
        hostName: schedule.userId,
        streamTitle: 'Your Streams',
        metrics: emailTemplateService.formatMetricsForEmail(metrics),
        frequency: schedule.frequency,
      },
      schedule.reportType
    );

    // Send email to each recipient
    for (const recipient of schedule.recipients) {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'noreply@edutalk.com',
        to: recipient,
        subject: emailTemplateService.generateEmailSubject(
          schedule.frequency,
          'Your Streams'
        ),
        html: emailHtml,
      });
    }

    // Update last sent time and calculate next send
    await ReportSchedule.findByIdAndUpdate(schedule._id, {
      lastSentAt: new Date(),
      nextSendAt: calculateNextSendTime(schedule),
    });

    console.log(`Report sent for schedule ${schedule._id}`);
  } catch (error) {
    console.error('Error sending report:', error);
  }
};

/**
 * Calculate next send time based on schedule
 */
const calculateNextSendTime = (schedule) => {
  const now = new Date();
  let next = new Date();

  switch (schedule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(schedule.hour, schedule.minute, 0, 0);
      break;

    case 'weekly':
      const daysUntilTarget =
        (schedule.dayOfWeek - next.getDay() + 7) % 7 || 7;
      next.setDate(next.getDate() + daysUntilTarget);
      next.setHours(schedule.hour, schedule.minute, 0, 0);
      break;

    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(schedule.dayOfMonth);
      next.setHours(schedule.hour, schedule.minute, 0, 0);
      break;
  }

  return next;
};

/**
 * Update next send times for all active schedules
 */
const updateNextSendTimes = async () => {
  try {
    const schedules = await ReportSchedule.find({ isActive: true });

    for (const schedule of schedules) {
      const nextSendAt = calculateNextSendTime(schedule);
      await ReportSchedule.findByIdAndUpdate(schedule._id, { nextSendAt });
    }

    console.log('Updated next send times for all schedules');
  } catch (error) {
    console.error('Error updating next send times:', error);
  }
};

/**
 * Create new report schedule
 */
exports.createSchedule = async (scheduleData) => {
  try {
    const nextSendAt = calculateNextSendTime(scheduleData);

    const schedule = new ReportSchedule({
      ...scheduleData,
      nextSendAt,
    });

    await schedule.save();
    return schedule;
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw error;
  }
};

/**
 * Send immediate test email
 */
exports.sendTestEmail = async (email, reportData) => {
  try {
    const emailHtml = emailTemplateService.generateEmailTemplate(
      reportData,
      reportData.reportType || 'summary'
    );

    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@edutalk.com',
      to: email,
      subject: 'Test Analytics Report - EduTalk',
      html: emailHtml,
    });

    return { success: true, message: 'Test email sent' };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw error;
  }
};
