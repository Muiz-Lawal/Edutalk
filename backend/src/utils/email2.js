import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER;
const SMTP_PASS = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@edutalk.app';

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

  const {
    to,
    subject = '',
    message = '',
    body = '',
    template = '',
    data = {},
    html,
    cc,
    bcc,
    attachments,
  } = options;

  if (!to) {
    throw new Error('Email recipient is required');
  }

  const htmlContent = html || generateEmailTemplate(subject, message || body, template, data);

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(`[email2] Mock SMTP send: to=${to} subject=${subject}`);
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      provider: 'smtp-mock',
    };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    const result = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      cc,
      bcc,
      subject,
      html: htmlContent,
      text: typeof message === 'string' ? message : body,
      attachments,
    });

    return {
      success: true,
      messageId: result.messageId,
      response: result.response,
      provider: 'smtp',
    };
  } catch (error) {
    console.error('[email2] Error sending email via SMTP:', error?.message || error);
    return {
      success: false,
      error: error?.message || 'Unknown email error',
      provider: 'smtp',
    };
  }
};

export const sendBulkEmail = async (recipients, subject, template, data = {}) => {
  return Promise.all(
    recipients.map((recipient) => sendEmail({
      to: recipient,
      subject,
      template,
      data,
    }))
  );
};

export const emailTemplates = {
  welcome: 'welcome',
  verification: 'email-verification',
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
