import axios from 'axios';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@edutalk.com';

// Mock implementation for Phase 2 development
export const sendEmail = async (...args) => {
  const options = typeof args[0] === 'object' && args[0] !== null
    ? args[0]
    : {
        to: args[0],
        subject: args[1],
        message: args[2],
        notificationType: args[3],
        data: args[4] || {},
      };

  const {
    to,
    subject,
    message: messageOverride = '',
    body,
    notificationType,
    template,
    data = {},
  } = options;

  const message = messageOverride || body || '';
  const type = notificationType || template || '';

  try {
    if (!SENDGRID_API_KEY) {
      console.warn(`Email would be sent to ${to}: ${subject}`);
      return { success: true, messageId: 'mock-' + Date.now() };
    }

    const html = generateEmailTemplate(subject, message, type, data);

    const response = await axios.post(
      SENDGRID_API_URL,
      {
        personalizations: [
          {
            to: [{ email: toEmail }],
            subject: subject,
          },
        ],
        from: {
          email: FROM_EMAIL,
          name: 'EduTalk',
        },
        content: [
          {
            type: 'text/html',
            value: html,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, messageId: response.headers['x-message-id'] };
  } catch (error) {
    console.error('Error sending email:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

export const sendBulkEmail = async (emails, subject, template, data) => {
  try {
    const results = [];

    for (const email of emails) {
      const result = await sendEmail(email, subject, '', template, data);
      results.push({ email, ...result });
    }

    return results;
  } catch (error) {
    console.error('Error sending bulk email:', error);
    throw error;
  }
};

function generateEmailTemplate(subject, message, notificationType, data) {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: #f8f9fa; padding: 20px; }
      .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
      .button { background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
      .code { background: #e8e8e8; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 14px; }
    </style>
  `;

  let body = '';

  switch (notificationType) {
    case 'payment_confirmation':
      body = `
        <h2>Payment Confirmed!</h2>
        <p>Your payment of <strong>$${data.amount}</strong> has been successfully processed.</p>
        <p><strong>Access Code:</strong></p>
        <div class="code">${data.accessCode}</div>
        <p>Your access to the class is valid from <strong>${data.startDate}</strong> to <strong>${data.endDate}</strong>.</p>
        <p><a href="${data.classUrl || '#'}" class="button">View Class</a></p>
      `;
      break;

    case 'session_reminder':
      body = `
        <h2>Your Class Starts Soon!</h2>
        <p>Your class <strong>${data.className}</strong> starts in <strong>${data.minutesUntilStart}</strong> minutes.</p>
        <p>Join at: <a href="${data.sessionUrl || '#'}" class="button">Join Session</a></p>
      `;
      break;

    case 'subscription_expiry':
      body = `
        <h2>Subscription Expiring</h2>
        <p>Your subscription to <strong>${data.className}</strong> will expire in <strong>${data.daysUntilExpiry}</strong> days.</p>
        <p>Renew now to continue learning: <a href="${data.renewalUrl || '#'}" class="button">Renew</a></p>
      `;
      break;

    case 'refund_confirmation':
      body = `
        <h2>Refund Processed</h2>
        <p>A refund of <strong>$${data.amount}</strong> has been processed to your account.</p>
        <p>Reason: ${data.reason || 'N/A'}</p>
        <p>The refund should appear in your account within 3-5 business days.</p>
      `;
      break;

    case 'class_announcement':
      body = `
        <h2>Announcement from ${data.hostName}</h2>
        <p>${data.message}</p>
      `;
      break;

    case 'recording_ready':
      body = `
        <h2>Recording Available</h2>
        <p>The recording for <strong>${data.className}</strong> is now available.</p>
        <p><a href="${data.recordingUrl || '#'}" class="button">Watch Recording</a></p>
      `;
      break;

    case 'content_rejected':
      body = `
        <h2>Content Review Decision</h2>
        <p>Your ${data.contentType} has been reviewed and requires your attention.</p>
        <p><strong>Decision:</strong> Rejected</p>
        <p><strong>Reason:</strong> ${data.reason}</p>
        ${data.categories ? `<p><strong>Violation Categories:</strong> ${data.categories}</p>` : ''}
        <p>You can view the moderation details and submit an appeal in your account.</p>
        <p><a href="${data.appealUrl || '#'}" class="button">Review & Appeal</a></p>
      `;
      break;

    case 'appeal_confirmation':
      body = `
        <h2>Appeal Received</h2>
        <p>We have received your appeal for your ${data.contentType}.</p>
        <p><strong>Original Reason:</strong> ${data.originalReason}</p>
        <p>Our team will review your appeal and notify you of the decision within 2-3 business days.</p>
        <p>Thank you for your patience.</p>
      `;
      break;

    case 'appeal_decision':
      body = `
        <h2>Appeal Decision</h2>
        <p>A decision has been made on your appeal.</p>
        <p><strong>Decision:</strong> ${data.decision === 'approved' ? 'Approved - Content Restored' : 'Denied'}</p>
        ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        ${data.decision === 'approved' 
          ? '<p>Your content has been restored and is now visible again.</p>'
          : '<p>If you believe this decision is incorrect, you may submit another appeal.</p>'
        }
        <p><a href="${data.dashboardUrl || '#'}" class="button">Go to Dashboard</a></p>
      `;
      break;

    case 'achievement_unlocked':
      body = `
        <h2>Achievement Unlocked!</h2>
        <p>Congratulations ${data.userName ? data.userName : ''}! You've just earned the <strong>${data.achievementName}</strong> badge.</p>
        <p>${data.description || ''}</p>
        <p><strong>Points earned:</strong> ${data.points || 0}</p>
        <p><a href="${data.dashboardUrl || '#'}" class="button">View in Dashboard</a></p>
      `;
      break;

    default:
      body = `<p>${message}</p>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      ${baseStyles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EduTalk</h1>
        </div>
        <div class="content">
          ${body}
        </div>
        <div class="footer">
          <p>&copy; 2024 EduTalk. All rights reserved.</p>
          <p><a href="#" style="color: white; text-decoration: none;">Manage Notifications</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const emailTemplates = {
  paymentConfirmation: (data) => ({
    subject: 'Payment Confirmed - Access Code Inside',
    data,
  }),
  sessionReminder: (data) => ({
    subject: `Class Starting Soon: ${data.className}`,
    data,
  }),
  subscriptionExpiry: (data) => ({
    subject: `Your Subscription to ${data.className} Expires Soon`,
    data,
  }),
  refundConfirmation: (data) => ({
    subject: 'Refund Processed',
    data,
  }),
};
