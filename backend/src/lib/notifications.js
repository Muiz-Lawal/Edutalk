import EmailJob from '../models/EmailJob.js';
import EmailDailyQuota from '../models/EmailDailyQuota.js';
import User from '../models/User.js';
import { sendMail, transactionalEmailTemplates } from '../utils/mailer.js';

const preferenceByTemplate = {
  student_session_reminder: 'sessionReminders',
  host_session_reminder: 'sessionReminders',
  recording_ready: 'recordingReady',
  new_enrollment: 'newEnrollment',
};

export const EMAIL_RETRY_BACKOFF_MS = Object.freeze([60_000, 5 * 60_000, 15 * 60_000]);
export const getEmailRetryDelayMs = (attempt) => EMAIL_RETRY_BACKOFF_MS[
  Math.max(0, Math.min(EMAIL_RETRY_BACKOFF_MS.length - 1, Number(attempt) - 1))
];

const dayStartForOffset = (date, offset) => new Date(Date.UTC(
  date.getUTCFullYear(),
  date.getUTCMonth(),
  date.getUTCDate() + offset,
));
const dayKey = (date) => date.toISOString().slice(0, 10);

async function reserveDailyCapacity({ userId, job, DailyQuotaModel, now }) {
  if (job.quotaDate
    && (job.quotaDate === dayKey(now) || new Date(job.scheduledAt || 0).getTime() > now.getTime())) {
    return { scheduledAt: job.scheduledAt || now, quotaDate: job.quotaDate };
  }
  for (let offset = 0; offset < 31; offset += 1) {
    const date = dayStartForOffset(now, offset);
    const key = dayKey(date);
    try {
      const quota = await DailyQuotaModel.findOneAndUpdate(
        { userId, dateKey: key, count: { $lt: 8 }, jobIds: { $ne: job._id } },
        { $inc: { count: 1 }, $addToSet: { jobIds: job._id } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      if (quota) return { scheduledAt: date.getTime() < now.getTime() ? now : date, quotaDate: key };
    } catch (error) {
      if (error?.code !== 11000) throw error;
      const alreadyReserved = await DailyQuotaModel.findOne({ userId, dateKey: key, jobIds: job._id });
      if (alreadyReserved) return { scheduledAt: date.getTime() < now.getTime() ? now : date, quotaDate: key };
    }
  }
  throw new Error('Unable to reserve transactional email delivery capacity');
}

export async function dispatch(recipient, template, payload = {}, {
  EmailJobModel = EmailJob,
  DailyQuotaModel = EmailDailyQuota,
  UserModel = User,
  now = new Date(),
} = {}) {
  await Promise.all([EmailJobModel, DailyQuotaModel]
    .filter((model) => typeof model.init === 'function')
    .map((model) => model.init()));
  const render = transactionalEmailTemplates[template];
  if (!render) throw new Error(`Unknown transactional email template: ${template}`);
  if (!payload.entityId) throw new Error('Transactional email requires an entityId');

  const userId = recipient?._id || recipient?.id || recipient;
  const user = typeof recipient === 'object' && recipient?.email
    ? recipient
    : await UserModel.findById(userId).select('email firstName lastName timezone emailPreferences');
  if (!user?.email) return { skipped: true, reason: 'recipient_unavailable' };

  const preference = preferenceByTemplate[template];
  if (preference && user.emailPreferences?.[preference] === false) {
    return { skipped: true, reason: 'preference_disabled' };
  }

  const data = { ...payload, firstName: payload.firstName || user.firstName, timezone: payload.timezone || user.timezone || 'UTC' };
  const message = render(data);
  const filter = { userId: user._id, template, entityId: String(payload.entityId) };
  let job;
  try {
    job = await EmailJobModel.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          userId: user._id,
          to: user.email,
          subject: message.subject,
          template,
          entityId: String(payload.entityId),
          data,
          status: 'pending',
          attempts: 0,
          scheduledAt: new Date(new Date(now).getTime() + 365 * 24 * 60 * 60 * 1000),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    job = await EmailJobModel.findOne(filter);
  }
  if (!job) throw new Error('Unable to queue transactional email');
  try {
    const reservation = await reserveDailyCapacity({
      userId: user._id,
      job,
      DailyQuotaModel,
      now: new Date(now),
    });
    if (job.quotaDate !== reservation.quotaDate
      || new Date(job.scheduledAt || 0).getTime() !== reservation.scheduledAt.getTime()) {
      job.scheduledAt = reservation.scheduledAt;
      job.quotaDate = reservation.quotaDate;
      await job.save();
    }
  } catch (error) {
    job.status = 'failed';
    job.lastError = 'Delivery could not be scheduled. Retry the email job.';
    await job.save();
    throw error;
  }
  return { job };
}

export async function sendTransactionalJob(job, { send = sendMail } = {}) {
  const render = transactionalEmailTemplates[job.template];
  if (!render) throw new Error('Unknown transactional email template');
  const message = render(job.data || {});
  return send({ to: job.to, ...message });
}

export const transactionalPreferenceKeys = Object.freeze({
  sessionReminders: 'sessionReminders',
  recordingReady: 'recordingReady',
  newEnrollment: 'newEnrollment',
  payoutEmails: 'payoutEmails',
  productUpdates: 'productUpdates',
});
