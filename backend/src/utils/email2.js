import axios from 'axios';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_API_URL = 'https://api.sendgrid.com/v3/mail/send';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@edutalk.com';

export const sendEmail = async (optionsOrTo, maybeSubject, maybeMessage, maybeTemplate, maybeData = {}) => {
  const options = typeof optionsOrTo === 'object' && optionsOrTo !== null
    ? optionsOrTo
    : {
        to: optionsOrTo,
        subject: maybeSubject,
        message: maybeMessage,
        template: maybeTemplate,
        data: maybeData,
      };

  const { to, subject = '', message = '', body = '', template = '', data = {} } = options;
  const html = generateEmailTemplate(subject, message || body, template, data);

  // If no SendGrid key, behave as a mock (safe for local dev)
  if (!SENDGRID_API_KEY) {
    console.warn(`[email2] Mock send: to=${to} subject=${subject}`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  const payload = {
    personalizations: [
      { to: [{ email: to }], subject },
    ],
    from: { email: FROM_EMAIL, name: 'EduTalk' },
    content: [{ type: 'text/html', value: html }],
  };

  const headers = {
    Authorization: `Bearer ${SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const res = await axios.post(SENDGRID_API_URL, payload, { headers });
    return { success: true, messageId: res.headers['x-message-id'] || res.headers['X-Message-Id'] || null };
  } catch (err) {
    console.error('[email2] Error sending email:', err.response?.data || err.message);
    return { success: false, error: err.message };
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

  let body = `<p>${message}</p>`;

  if (notificationType === 'email-verification') {
    body = `
      <h2>Verify your email</h2>
      <p>${data.firstName || 'User'}, click the link below to verify your email address.</p>
      <p><a href="${data.verificationLink || '#'}" class="button">Verify Email</a></p>
    `;
  }

  return `<!DOCTYPE html><html><head>${baseStyles}</head><body><div class="container"><div class="header"><h1>EduTalk</h1></div><div class="content">${body}</div><div class="footer"><p>&copy; ${new Date().getFullYear()} EduTalk</p></div></div></body></html>`;
}
