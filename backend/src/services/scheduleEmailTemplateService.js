/**
 * Schedule Email Template Service
 * Generates professional HTML email templates for stream reminders
 */

const generateScheduleReminderEmail = (schedule, reminderType, studentName, hostName) => {
  const scheduleDate = new Date(schedule.scheduledStartTime);
  const formattedDate = scheduleDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = scheduleDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let reminderMessage = '';
  let subject = '';

  switch (reminderType) {
    case '24h':
      reminderMessage = 'Your class starts tomorrow! Don\'t miss it.';
      subject = `Reminder: ${schedule.title} starts tomorrow`;
      break;
    case '1h':
      reminderMessage = 'Your class starts in 1 hour. Get ready!';
      subject = `Starting Soon: ${schedule.title}`;
      break;
    case '30m':
      reminderMessage = 'Your class is starting in 30 minutes. Join now!';
      subject = `${schedule.title} is starting now!`;
      break;
    default:
      reminderMessage = 'Your scheduled class is about to start!';
      subject = `${schedule.title} reminder`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .class-details { background: white; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { margin: 10px 0; }
        .detail-label { font-weight: 600; color: #667eea; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 20px 0; }
        .cta-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
        .message { background: #e8f4f8; color: #0c5460; padding: 15px; border-radius: 4px; margin-bottom: 20px; border-left: 4px solid #0c5460; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📚 ${schedule.title}</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">${reminderMessage}</p>
        </div>

        <div class="content">
          <p>Hi ${studentName},</p>

          <div class="message">
            <strong>⏰ Don't miss your class!</strong><br>
            Your scheduled class is coming up soon. Make sure to join on time.
          </div>

          <div class="class-details">
            <div class="detail-row">
              <span class="detail-label">📅 Date:</span> ${formattedDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">🕐 Time:</span> ${formattedTime}
            </div>
            <div class="detail-row">
              <span class="detail-label">👨‍🏫 Instructor:</span> ${hostName}
            </div>
            ${schedule.description ? `
            <div class="detail-row">
              <span class="detail-label">📝 Description:</span><br>
              ${schedule.description.substring(0, 200)}${schedule.description.length > 200 ? '...' : ''}
            </div>
            ` : ''}
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/watch/${schedule._id}/waiting" class="cta-button">
              ✨ Join Class Now
            </a>
          </div>

          <p style="margin-top: 30px; color: #666;">
            If you have any questions or need help, please don't hesitate to reach out.
          </p>
        </div>

        <div class="footer">
          <p>&copy; 2024 EduTalk. All rights reserved.</p>
          <p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings/notifications" style="color: #999; text-decoration: none;">
              Manage notification preferences
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};

export default {
  generateScheduleReminderEmail,
};
