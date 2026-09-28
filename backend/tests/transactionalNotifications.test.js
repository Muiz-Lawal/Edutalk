import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  classCancelledEmail,
  enrollmentReceiptEmail,
  hostSessionReminderEmail,
  newEnrollmentEmail,
  noShowAlertEmail,
  payoutSentEmail,
  recordingReadyEmail,
  refundProcessedEmail,
  studentSessionReminderEmail,
  transactionalEmailTemplates,
  verificationDecisionEmail,
} from '../src/utils/mailer.js';
import { dispatch, getEmailRetryDelayMs, sendTransactionalJob } from '../src/lib/notifications.js';

describe('transactional email templates', () => {
  const cases = [
    ['enrollment_receipt', enrollmentReceiptEmail, { classTitle: 'Biology', classId: 'class-1', orderId: 'order-1', items: [{ classTitle: 'Biology', amount: 27900, currency: 'NGN', amountUsd: 18 }] }, 'Your EduTalk enrollment is confirmed'],
    ['student_session_reminder', studentSessionReminderEmail, { classTitle: 'Biology', mark: '24h', scheduledStartTime: '2026-09-29T14:00:00Z', timezone: 'Africa/Lagos', sessionId: 'session-1' }, 'Reminder: Biology starts in 24 hours'],
    ['host_session_reminder', hostSessionReminderEmail, { classTitle: 'Biology', sessionId: 'session-1' }, 'Reminder: Biology starts in 1 hour'],
    ['class_cancelled', classCancelledEmail, { classTitle: 'Biology', hostNote: '<script>bad</script>' }, 'Class cancelled: Biology'],
    ['refund_processed', refundProcessedEmail, { amount: 18, currency: 'USD', paymentReference: 'ref-1' }, 'Your refund has been processed'],
    ['payout_sent', payoutSentEmail, { amount: 18, currency: 'USD', processor: 'Stripe', reference: 'pay-1' }, 'Your EduTalk payout has been sent'],
    ['recording_ready', recordingReadyEmail, { classTitle: 'Biology', classId: 'class-1' }, 'Your class recording is ready'],
    ['verification_decision', verificationDecisionEmail, { decision: 'rejected', reason: '<provider error>' }, 'Your host verification needs attention'],
    ['new_enrollment', newEnrollmentEmail, { classTitle: 'Biology', classId: 'class-1', amount: 18, currency: 'USD' }, 'A new student enrolled in your class'],
    ['no_show_alert', noShowAlertEmail, { classTitle: 'Biology', sessionId: 'session-1', attendedCount: 2, enrolledCount: 6 }, 'Attendance was below 50% for Biology'],
  ];

  it.each(cases)('%s uses its expected subject and accessible table email layout', (name, template, payload, subject) => {
    expect(transactionalEmailTemplates[name]).toBe(template);
    const message = template(payload);
    expect(message.subject).toBe(subject);
    expect(message.html).toContain('max-width:600px');
    expect(message.html).toContain('EduTalk');
    expect(message.html).toContain('4F46E5');
    expect(message.text).toBeTruthy();
  });

  it('renders charged currency, one row per cart item, and escapes host-provided text', () => {
    const receipt = enrollmentReceiptEmail({
      orderId: 'order-1',
      items: [
        { classTitle: 'Biology', hostName: 'A Host', dates: 'Sep 1–Sep 5', amount: 27900, currency: 'NGN', amountUsd: 18 },
        { classTitle: 'Chemistry', hostName: 'Another Host', amount: 10, currency: 'USD' },
      ],
    });
    expect(receipt.html.match(/<tr><td style="border-bottom:/g)).toHaveLength(2);
    expect(receipt.html).toContain('₦27,900 ($18.00 USD)');
    expect(classCancelledEmail({ classTitle: 'Biology', hostNote: '<script>bad</script>' }).html).not.toContain('<script>');
    expect(verificationDecisionEmail({ decision: 'rejected', reason: '<provider error>' }).text).not.toContain('<provider error>');
  });

  it('uses a labeled recipient timezone in reminder copy', () => {
    const reminder = studentSessionReminderEmail({
      classTitle: 'Biology',
      mark: '1h',
      scheduledStartTime: '2026-09-29T14:00:00Z',
      sessionId: 'session-1',
      timezone: 'Africa/Lagos',
    });
    expect(reminder.text).toContain('(Africa/Lagos)');
    expect(reminder.html).toContain('/session/session-1');
  });

  it('includes a separate join action for every class in a reminder digest', () => {
    const digest = studentSessionReminderEmail({
      digest: true,
      mark: '24h',
      timezone: 'Europe/London',
      sessions: [
        { classTitle: 'Biology', sessionId: 'bio-session', scheduledStartTime: '2026-09-29T14:00:00Z' },
        { classTitle: 'Chemistry', sessionId: 'chem-session', scheduledStartTime: '2026-09-29T16:00:00Z' },
      ],
    });
    expect(digest.subject).toBe('Your classes tomorrow');
    expect(digest.html.match(/>Join session<\/a>/g)).toHaveLength(2);
    expect(digest.html).toContain('/session/bio-session');
    expect(digest.html).toContain('/session/chem-session');
  });
});

describe('transactional notification dispatch', () => {
  let jobs;
  let quotas;
  let EmailJobModel;
  let DailyQuotaModel;

  beforeEach(() => {
    jobs = new Map();
    quotas = new Map();
    EmailJobModel = {
      findOneAndUpdate: vi.fn(async (filter, update) => {
        const key = `${filter.userId}:${filter.template}:${filter.entityId}`;
        if (!jobs.has(key)) {
          const job = {
            _id: key,
            userId: filter.userId,
            template: filter.template,
            entityId: filter.entityId,
            ...update.$setOnInsert,
            createdAt: new Date('2026-09-28T10:00:00Z'),
            save: vi.fn(async () => {}),
          };
          jobs.set(key, job);
        }
        return jobs.get(key);
      }),
      findOne: vi.fn(async (filter) => jobs.get(`${filter.userId}:${filter.template}:${filter.entityId}`)),
    };
    DailyQuotaModel = {
      findOneAndUpdate: vi.fn(async (filter) => {
        const key = `${filter.userId}:${filter.dateKey}`;
        const quota = quotas.get(key) || { count: 0, jobIds: [] };
        if (quota.jobIds.includes(filter.jobIds.$ne) || quota.count >= 8) {
          const error = new Error('Quota unique constraint');
          error.code = 11000;
          throw error;
        }
        quota.count += 1;
        quota.jobIds.push(filter.jobIds.$ne);
        quotas.set(key, quota);
        return quota;
      }),
      findOne: vi.fn(async (filter) => {
        const quota = quotas.get(`${filter.userId}:${filter.dateKey}`);
        return quota?.jobIds.includes(filter.jobIds) ? quota : null;
      }),
    };
  });

  it('queues a receipt idempotently and sends only the persisted template payload', async () => {
    const user = { _id: 'student-1', email: 'student@example.test', firstName: 'Sam' };
    const payload = {
      entityId: 'payment-1',
      orderId: 'order-1',
      items: [{ classTitle: 'Biology', amount: 27900, currency: 'NGN', amountUsd: 18 }],
    };
    await dispatch(user, 'enrollment_receipt', payload, { EmailJobModel, DailyQuotaModel, now: new Date('2026-09-28T10:00:00Z') });
    await dispatch(user, 'enrollment_receipt', payload, { EmailJobModel, DailyQuotaModel, now: new Date('2026-09-28T10:00:00Z') });
    expect(jobs.size).toBe(1);
    expect(EmailJobModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect([...quotas.values()][0].count).toBe(1);
    const send = vi.fn();
    await sendTransactionalJob([...jobs.values()][0], { send });
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0].html).toContain('($18.00 USD)');
  });

  it('honors optional preferences but always queues payout records', async () => {
    const user = {
      _id: 'host-1',
      email: 'host@example.test',
      emailPreferences: { sessionReminders: false, payoutEmails: false },
    };
    const reminder = await dispatch(user, 'student_session_reminder', { entityId: 'session-1' }, { EmailJobModel, DailyQuotaModel });
    const payout = await dispatch(user, 'payout_sent', { entityId: 'payout-1', amount: 5, currency: 'USD' }, { EmailJobModel, DailyQuotaModel });
    expect(reminder).toEqual({ skipped: true, reason: 'preference_disabled' });
    expect(payout.job).toBeDefined();
    expect(jobs.size).toBe(1);
  });

  it('reserves a date with capacity after the daily per-user limit', async () => {
    const now = new Date('2026-09-28T10:00:00Z');
    const user = { _id: 'student-2', email: 'student@example.test' };
    for (let index = 0; index < 9; index += 1) {
      await dispatch(user, 'enrollment_receipt', { entityId: `payment-${index}` }, { EmailJobModel, DailyQuotaModel, now });
    }
    const scheduled = [...jobs.values()].map((job) => job.scheduledAt);
    expect(scheduled.filter((date) => date.toISOString().startsWith('2026-09-28'))).toHaveLength(8);
    expect(scheduled.find((date) => date.toISOString().startsWith('2026-09-29'))).toBeDefined();
  });

  it('uses three bounded retry delays and surfaces a forced sender failure', async () => {
    expect(getEmailRetryDelayMs(1)).toBe(60_000);
    expect(getEmailRetryDelayMs(2)).toBe(5 * 60_000);
    expect(getEmailRetryDelayMs(3)).toBe(15 * 60_000);
    const send = vi.fn().mockRejectedValue(new Error('SMTP unavailable'));
    await expect(sendTransactionalJob({
      template: 'enrollment_receipt',
      to: 'student@example.test',
      data: { entityId: 'payment-1' },
    }, { send })).rejects.toThrow('SMTP unavailable');
  });
});
