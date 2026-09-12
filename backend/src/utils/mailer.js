import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

let lastPreview = null;
const getAppUrl = () => process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const footer = (message = "Didn't create an EduTalk account? You can safely ignore this email — no changes will be made.") => `
  <tr><td style="border-top:1px solid #E2E8F0;padding:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;">
    <p>${message}</p>
    <p>EduTalk — Learn on Your Terms. Pay for the Time You Need.</p>
    <p>Questions? Just reply to this email — a real person reads every message.</p>
  </td></tr>`;

const layout = (content, footerMessage) => `<!doctype html><html><body style="margin:0;background:#fff;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#374151;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:32px auto;border:1px solid #E2E8F0;border-radius:12px;background:#fff;"><tr><td style="padding:32px;">
<div style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:28px;">EduTalk</div>${content}${footer(footerMessage)}</td></tr></table></body></html>`;

const button = (href, label) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto 0;"><tr><td style="border-radius:8px;background:#4F46E5;"><a href="${href}" style="display:inline-block;padding:12px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">${label}</a></td></tr></table>`;
const codeBox = (code) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto;"><tr><td style="background:#EEF2FF;border-radius:8px;padding:16px 32px;color:#4F46E5;font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;">${escapeHtml(code)}</td></tr></table>`;

export const verificationEmail = ({ firstName, code, email }) => {
  const link = `${getAppUrl()}/verify-email?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
  return {
    subject: `Your EduTalk verification code: ${code}`,
    html: layout(`<span style="display:none!important;max-height:0;overflow:hidden;opacity:0;">Enter this code to confirm your email — it expires in 10 minutes.</span><div style="font-size:16px;line-height:1.6;"><p>Hi ${escapeHtml(firstName)},</p><p>Thanks for creating an EduTalk account. Enter this code to confirm your email address:</p>${codeBox(code)}${button(link, 'Confirm my email')}<p style="margin-top:20px;text-align:center;color:#64748B;font-size:13px;">This code expires in 10 minutes. If it expires, request a new one on the verification page.</p></div>`),
    text: `Hi ${firstName},\nThanks for creating an EduTalk account. Enter this code to confirm your email address:\n${code}\nOr confirm here: ${link}\nThis code expires in 10 minutes.\nDidn't create an EduTalk account? You can safely ignore this email.`,
  };
};

export const welcomeEmail = ({ firstName, isHost }) => {
  const message = isHost
    ? 'Your account is ready. Finish your host profile and publish your first class.'
    : 'Your account is ready. Browse live classes and pay only for the days you need.';
  const href = `${getAppUrl()}${isHost ? '/onboarding/host' : '/classes'}`;
  const label = isHost ? 'Finish host profile' : 'Browse classes';
  return {
    subject: `Welcome to EduTalk, ${firstName}!`,
    html: layout(`<div style="font-size:16px;line-height:1.6;"><p>Hi ${escapeHtml(firstName)},</p><p>${message}</p>${button(href, label)}</div>`),
    text: `Hi ${firstName},\n${message}\n${href}`,
  };
};

export const passwordResetEmail = ({ firstName, code, email }) => {
  const link = `${getAppUrl()}/reset-password?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`;
  return {
    subject: 'Reset your EduTalk password',
    html: layout(`<div style="font-size:16px;line-height:1.6;"><p>Hi ${escapeHtml(firstName)},</p><p>We received a request to reset your EduTalk password. Enter this code:</p>${codeBox(code)}${button(link, 'Choose a new password')}<p style="margin-top:20px;text-align:center;color:#64748B;font-size:13px;">This code expires in 15 minutes.</p></div>`, "Didn't request a reset? Ignore this email — your password is unchanged."),
    text: `Hi ${firstName},\nWe received a request to reset your EduTalk password. Enter this code:\n${code}\nChoose a new password: ${link}\nThis code expires in 15 minutes.\nDidn't request a reset? Ignore this email — your password is unchanged.`,
  };
};

const getTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS }
    : undefined,
});

const saveMailPreview = async ({ html, text, subject, code, previewName = 'last' }) => {
  const previewDirectory = path.resolve(process.cwd(), 'tmp', 'mail-previews');
  await fs.mkdir(previewDirectory, { recursive: true });
  const previewPath = path.join(previewDirectory, `${previewName}-${Date.now()}.html`);
  await fs.writeFile(previewPath, html, 'utf8');
  lastPreview = { html, text, subject, previewPath };
  console.info(`[mailer:${previewName}] ${subject} | code=${code || 'n/a'} | preview=${previewPath}`);
  return { previewPath };
};

const maskAddress = (value) => {
  if (!value || typeof value !== 'string') return 'unknown';
  const [localPart, domainPart] = value.split('@');
  if (!domainPart) return 'unknown';
  const maskedLocal = localPart.length <= 2 ? `${localPart[0] || ''}*` : `${localPart.slice(0, 2)}***`;
  return `${maskedLocal}@${domainPart}`;
};

export const sendMail = async ({ to, subject, html, text, code }) => {
  const provider = process.env.MAIL_PROVIDER || (process.env.SMTP_HOST ? 'smtp' : 'dev');
  if (provider === 'dev') {
    await saveMailPreview({ html, text, subject, code, previewName: 'dev' });
    return { messageId: `dev-${Date.now()}` };
  }

  try {
    return await getTransporter().sendMail({
      from: process.env.MAIL_FROM || 'EduTalk <no-reply@mail.edutalk.com>',
      to,
      subject,
      html,
      text,
    });
  } catch (error) {
    const redactedRecipient = maskAddress(to);
    console.warn(`[mailer:smtp-fallback] SMTP send failed for ${redactedRecipient}. Using preview mode in development.`);
    console.warn(`[mailer:smtp-fallback] ${error?.message || 'Unknown SMTP error'} `);

    if (process.env.NODE_ENV === 'production') {
      throw error;
    }

    await saveMailPreview({ html, text, subject, code, previewName: 'smtp-fallback' });
    return { messageId: `smtp-fallback-${Date.now()}` };
  }
};

export const getLastPreview = () => lastPreview;
