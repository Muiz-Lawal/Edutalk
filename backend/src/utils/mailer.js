import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

let lastPreview = null;
const getAppUrl = () => process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const footer = (message = 'If you were not expecting this email, you can safely ignore it.') => `
  <tr><td style="border-top:1px solid #E2E8F0;padding:24px 0 0;color:#94A3B8;font-size:13px;line-height:1.6;">
    <p>${message}</p>
    <p>EduTalk — Learn on Your Terms. Pay for the Time You Need.</p>
    <p>Questions? Just reply to this email — a real person reads every message.</p>
    <!-- Postal address placeholder for future CAN-SPAM compliance. -->
  </td></tr>`;

const layout = (content, footerMessage, { marketing = false } = {}) => `<!doctype html><html><body style="margin:0;background:#fff;font-family:Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#374151;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:32px auto;border:1px solid #E2E8F0;border-radius:12px;background:#fff;"><tr><td style="padding:32px;">
<div style="font-size:20px;font-weight:800;color:#0F172A;margin-bottom:28px;">EduTalk</div>${content}</td></tr>${marketing ? `<tr><td style="padding:12px 32px 0;color:#64748B;font-size:12px;">You are receiving product updates. <a href="${escapeHtml(`${getAppUrl()}/settings/notifications`)}">Unsubscribe</a>.</td></tr>` : ''}${footer(footerMessage)}</table></body></html>`;

const button = (href, label) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto 0;"><tr><td style="border-radius:8px;background:#4F46E5;"><a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 32px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a></td></tr></table>`;
const codeBox = (code) => `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto;"><tr><td style="background:#EEF2FF;border-radius:8px;padding:16px 32px;color:#4F46E5;font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;">${escapeHtml(code)}</td></tr></table>`;
const textLink = (pathPart) => `${getAppUrl()}${pathPart}`;
const dateTime = (value, timezone = 'UTC') => {
  if (!value) return 'Time to be confirmed';
  try {
    return `${new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone || 'UTC',
    }).format(new Date(value))} (${timezone || 'UTC'})`;
  } catch {
    return `${new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value))} (UTC)`;
  }
};
const money = (amount, currency = 'USD') => new Intl.NumberFormat(
  currency === 'NGN' ? 'en-NG' : currency === 'INR' ? 'en-IN' : 'en',
  {
    style: 'currency',
    currency,
    ...(currency === 'NGN' ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
  },
).format(Number(amount || 0));
const chargedAmount = ({ amount, currency = 'USD', amountUsd }) => {
  const charged = `${money(amount, currency)}${currency === 'USD' ? ' USD' : ''}`;
  return amountUsd == null || currency === 'USD' ? charged : `${charged} (${money(amountUsd, 'USD')} USD)`;
};
const emailBody = (paragraphs) => `<div style="font-size:16px;line-height:1.6;">${paragraphs}</div>`;
const rowTable = (rows) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:16px 0;"><tbody>${rows}</tbody></table>`;
const tableRow = (label, value) => `<tr><th align="left" style="border-bottom:1px solid #E2E8F0;padding:10px 8px;color:#64748B;font-weight:600;">${escapeHtml(label)}</th><td style="border-bottom:1px solid #E2E8F0;padding:10px 8px;">${escapeHtml(value)}</td></tr>`;

export const enrollmentReceiptEmail = (payload) => {
  const items = payload.items || [{
    classTitle: payload.classTitle,
    hostName: payload.hostName,
    dates: payload.dates,
    amount: payload.amount,
    currency: payload.currency,
    amountUsd: payload.amountUsd,
  }];
  const rows = items.map((item) => `<tr><td style="border-bottom:1px solid #E2E8F0;padding:12px 8px;"><strong>${escapeHtml(item.classTitle)}</strong><br>${escapeHtml(item.hostName || 'EduTalk host')}<br>${escapeHtml(item.dates || 'Dates to be confirmed')}<br>${escapeHtml(chargedAmount(item))}</td></tr>`).join('');
  const href = textLink(`/class/${encodeURIComponent(payload.classId || items[0]?.classId || '')}`);
  return {
    subject: 'Your EduTalk enrollment is confirmed',
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>Your enrollment is confirmed. Here are the details:</p>${rowTable(rows)}<p>Order ID: ${escapeHtml(payload.orderId || '')}</p>${button(href, 'Go to class')}`)),
    text: `Hello ${payload.firstName || 'there'},\nYour enrollment is confirmed.\n${items.map((item) => `${item.classTitle} — ${item.hostName || 'EduTalk host'} — ${item.dates || 'Dates to be confirmed'} — ${chargedAmount(item)}`).join('\n')}\nOrder ID: ${payload.orderId || ''}\n${href}`,
  };
};

export const studentSessionReminderEmail = (payload) => {
  const digest = Boolean(payload.digest);
  const sessions = payload.sessions || [payload];
  const lead = payload.mark === '24h' ? 'in 24 hours' : 'in 1 hour';
  const subject = digest && payload.mark === '24h'
    ? 'Your classes tomorrow'
    : digest
      ? 'Your classes starting in 1 hour'
      : `Reminder: ${payload.classTitle} starts ${lead}`;
  const rows = sessions.map((session) => `<tr><td style="border-bottom:1px solid #E2E8F0;padding:12px 8px;"><strong>${escapeHtml(session.classTitle)}</strong><br>Host: ${escapeHtml(session.hostName || 'EduTalk host')}<br>${escapeHtml(dateTime(session.scheduledStartTime, payload.timezone))}${button(textLink(`/session/${encodeURIComponent(session.sessionId || '')}`), 'Join session')}</td></tr>`).join('');
  return {
    subject,
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>${digest ? 'Here are your classes tomorrow.' : `${escapeHtml(payload.classTitle)} starts ${lead}.`}</p>${rowTable(rows)}`)),
    text: `Hello ${payload.firstName || 'there'},\n${digest ? 'Your classes tomorrow' : `${payload.classTitle} starts ${lead}`}\n${sessions.map((session) => `${session.classTitle} — ${dateTime(session.scheduledStartTime, payload.timezone)} — Host: ${session.hostName || 'EduTalk host'} — ${textLink(`/session/${encodeURIComponent(session.sessionId || '')}`)}`).join('\n')}`,
  };
};

export const hostSessionReminderEmail = (payload) => {
  const href = textLink(`/session/${encodeURIComponent(payload.sessionId || '')}`);
  return {
    subject: `Reminder: ${payload.classTitle} starts in 1 hour`,
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>${escapeHtml(payload.classTitle)} starts in one hour. Your enrolled roster includes ${Number(payload.rosterSize || 0)} students.</p><p>${escapeHtml(dateTime(payload.scheduledStartTime, payload.timezone))}</p>${button(href, 'Start session')}`)),
    text: `Hello ${payload.firstName || 'there'},\n${payload.classTitle} starts in one hour.\nRoster size: ${Number(payload.rosterSize || 0)}\n${dateTime(payload.scheduledStartTime, payload.timezone)}\n${href}`,
  };
};

export const classCancelledEmail = (payload) => {
  const href = textLink('/dashboard');
  const cancelledDates = (payload.cancelledDates || [payload.cancelledDate]).filter(Boolean).map((date) => dateTime(date, payload.timezone)).join(', ');
  return {
    subject: `Class cancelled: ${payload.classTitle}`,
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>${escapeHtml(payload.classTitle)} has been cancelled.</p><p>Cancelled date(s): ${escapeHtml(cancelledDates || 'The scheduled session')}</p><p>Host note: ${escapeHtml(payload.hostNote || 'No additional note was provided.')}</p><p>You’ll receive a full refund if this was a paid session and it’s not rescheduled — within 5–7 days.</p>${button(href, 'View your classes')}`)),
    text: `Hello ${payload.firstName || 'there'},\n${payload.classTitle} has been cancelled.\nCancelled date(s): ${cancelledDates || 'The scheduled session'}\nHost note: ${payload.hostNote || 'No additional note was provided.'}\nYou’ll receive a full refund if this was a paid session and it’s not rescheduled — within 5–7 days.\n${href}`,
  };
};

export const refundProcessedEmail = (payload) => {
  const href = textLink('/payments');
  return {
    subject: 'Your refund has been processed',
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>Your refund of ${escapeHtml(chargedAmount(payload))} has been processed.</p><p>Original payment reference: ${escapeHtml(payload.paymentReference || 'Not available')}</p><p>Please allow 5–10 business days for the refund to appear on your statement.</p>${button(href, 'View receipt')}`)),
    text: `Hello ${payload.firstName || 'there'},\nYour refund of ${chargedAmount(payload)} has been processed.\nOriginal payment reference: ${payload.paymentReference || 'Not available'}\nPlease allow 5–10 business days for the refund to appear on your statement.\n${href}`,
  };
};

export const payoutSentEmail = (payload) => {
  const href = textLink('/host-dashboard?tab=payouts');
  return {
    subject: 'Your EduTalk payout has been sent',
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>Your payout of ${escapeHtml(chargedAmount(payload))} was sent through ${escapeHtml(payload.processor || 'your payout processor')}.</p><p>Reference: ${escapeHtml(payload.reference || 'Not available')}</p><p>${escapeHtml(payload.balanceNote || 'Your remaining balance is available in payout history.')}</p>${button(href, 'Payout history')}`)),
    text: `Hello ${payload.firstName || 'there'},\nYour payout of ${chargedAmount(payload)} was sent through ${payload.processor || 'your payout processor'}.\nReference: ${payload.reference || 'Not available'}\n${payload.balanceNote || 'Your remaining balance is available in payout history.'}\n${href}`,
  };
};

export const recordingReadyEmail = (payload) => {
  const href = textLink(`/class/${encodeURIComponent(payload.classId || '')}?tab=recordings`);
  return {
    subject: 'Your class recording is ready',
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>The recording for ${escapeHtml(payload.classTitle)} is ready to watch.</p><p>Session date: ${escapeHtml(dateTime(payload.sessionDate, payload.timezone))}</p>${button(href, 'Watch recording')}`)),
    text: `Hello ${payload.firstName || 'there'},\nThe recording for ${payload.classTitle} is ready to watch.\nSession date: ${dateTime(payload.sessionDate, payload.timezone)}\n${href}`,
  };
};

const friendlyVerificationReason = (reason) => ({
  document_unreadable: 'The submitted documents could not be read clearly.',
  document_expired: 'One or more submitted documents have expired.',
  details_mismatch: 'The submitted details did not match the account information.',
  unsupported_document: 'The submitted document type could not be accepted.',
}[reason] || 'We could not verify the submitted documents. Please review them and try again.');

export const verificationDecisionEmail = (payload) => {
  const approved = payload.decision === 'approved';
  const href = textLink(approved ? '/host-dashboard' : '/onboarding/host');
  return {
    subject: approved ? 'Your host verification was approved' : 'Your host verification needs attention',
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>${approved ? 'Your identity verification has been approved.' : escapeHtml(friendlyVerificationReason(payload.reason))}</p>${approved ? '' : `${button(href, 'Resubmit documents')}`}`)),
    text: `Hello ${payload.firstName || 'there'},\n${approved ? 'Your identity verification has been approved.' : `${friendlyVerificationReason(payload.reason)} Resubmit your documents: ${href}`}`,
  };
};

export const newEnrollmentEmail = (payload) => {
  const href = textLink(`/host/classes/${encodeURIComponent(payload.classId || '')}`);
  return {
    subject: 'A new student enrolled in your class',
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>${escapeHtml(payload.studentFirstName || 'A student')} enrolled in ${escapeHtml(payload.classTitle)}.</p><p>Your net earnings from this enrollment are ${escapeHtml(chargedAmount(payload))}.</p><p>Subscribers: ${Number(payload.subscriberCount || 0)}${payload.nextTierThreshold ? ` of ${Number(payload.nextTierThreshold)} needed for the next plan tier` : ' — highest plan tier reached'}.</p>${button(href, 'View class')}`)),
    text: `Hello ${payload.firstName || 'there'},\n${payload.studentFirstName || 'A student'} enrolled in ${payload.classTitle}.\nNet earnings: ${chargedAmount(payload)}\nSubscribers: ${Number(payload.subscriberCount || 0)}${payload.nextTierThreshold ? ` of ${Number(payload.nextTierThreshold)} needed for the next plan tier` : ' — highest plan tier reached'}.\n${href}`,
  };
};

export const noShowAlertEmail = (payload) => {
  const href = textLink(`/session/${encodeURIComponent(payload.sessionId || '')}`);
  return {
    subject: `Attendance was below 50% for ${payload.classTitle}`,
    html: layout(emailBody(`<p>Hello ${escapeHtml(payload.firstName || 'there')},</p><p>Attendance for ${escapeHtml(payload.classTitle)} was below 50% of enrolled students.</p><p>${Number(payload.attendedCount || 0)} attended out of ${Number(payload.enrolledCount || 0)} enrolled students.</p>${button(href, 'View attendance')}`)),
    text: `Hello ${payload.firstName || 'there'},\nAttendance for ${payload.classTitle} was below 50% of enrolled students.\n${Number(payload.attendedCount || 0)} attended out of ${Number(payload.enrolledCount || 0)} enrolled students.\n${href}`,
  };
};

export const transactionalEmailTemplates = {
  enrollment_receipt: enrollmentReceiptEmail,
  student_session_reminder: studentSessionReminderEmail,
  host_session_reminder: hostSessionReminderEmail,
  class_cancelled: classCancelledEmail,
  refund_processed: refundProcessedEmail,
  payout_sent: payoutSentEmail,
  recording_ready: recordingReadyEmail,
  verification_decision: verificationDecisionEmail,
  new_enrollment: newEnrollmentEmail,
  no_show_alert: noShowAlertEmail,
};

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
