import EmailJob from '../models/EmailJob.js';
import User from '../models/User.js';

export const runBadgeEngine = async (req, res) => {
  try {
    const { runBadgeEngine } = await import('../services/badgeEngine.js');
    await runBadgeEngine();
    res.json({ message: 'Badge engine triggered' });
  } catch (err) {
    console.error('Failed to run badge engine:', err);
    res.status(500).json({ error: err.message || 'Failed to run badge engine' });
  }
};

export const listEmailJobs = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const q = {};
    if (status) q.status = status;
    const skip = (page - 1) * limit;
    const jobs = await EmailJob.find(q)
      .select('_id to subject template status attempts lastError createdAt sentAt scheduledAt')
      .sort({ createdAt: -1 }).skip(parseInt(skip)).limit(parseInt(limit));
    const total = await EmailJob.countDocuments(q);
    res.json({ jobs, total });
  } catch (err) {
    console.error('Failed to list email jobs:', err);
    res.status(500).json({ error: err.message });
  }
};

export const retryEmailJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await EmailJob.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (['sent', 'sending', 'suppressed'].includes(job.status)) {
      return res.status(409).json({ error: 'Only unsent email jobs can be retried.' });
    }
    job.status = 'pending';
    job.attempts = 0;
    job.lastError = null;
    job.scheduledAt = new Date();
    job.quotaDate = null;
    await job.save();
    res.json({ message: 'Job requeued', job: safeEmailJob(job) });
  } catch (err) {
    console.error('Failed to retry email job:', err);
    res.status(500).json({ error: err.message });
  }
};

export const retryAllFailedEmailJobs = async (req, res) => {
  try {
    const result = await EmailJob.updateMany(
      { status: 'failed' },
      { $set: { status: 'pending', attempts: 0, lastError: null, scheduledAt: new Date() } }
    );
    res.json({ message: 'Requeued failed jobs', modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Failed to retry all email jobs:', err);
    res.status(500).json({ error: err.message });
  }
};

export const getEmailJobDetails = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await EmailJob.findById(jobId)
      .select('_id to subject template status attempts lastError createdAt sentAt scheduledAt')
      .lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    console.error('Failed to get email job details:', err);
    res.status(500).json({ error: err.message });
  }
};

import { sendEmail } from '../utils/email.js';
import { sendTransactionalJob } from '../lib/notifications.js';

const safeEmailJob = (job) => {
  const value = job?.toObject ? job.toObject() : { ...job };
  delete value.body;
  delete value.data;
  delete value.userId;
  delete value.entityId;
  return value;
};

export const sendEmailJobNow = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await EmailJob.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (['sent', 'sending', 'suppressed'].includes(job.status)) {
      return res.status(409).json({ error: 'This email job has already been sent or is being processed.' });
    }
    if (job.userId && job.entityId) {
      const preference = {
        student_session_reminder: 'sessionReminders',
        host_session_reminder: 'sessionReminders',
        recording_ready: 'recordingReady',
        new_enrollment: 'newEnrollment',
      }[job.template];
      if (preference) {
        const user = await User.findById(job.userId).select(`emailPreferences.${preference}`);
        if (user?.emailPreferences?.[preference] === false) {
          job.status = 'suppressed';
          job.lastError = null;
          await job.save();
          return res.status(409).json({ error: 'The recipient has disabled this email notification.' });
        }
      }
    }

    // Increment attempt count and set sending
    job.attempts = (job.attempts || 0) + 1;
    job.status = 'sending';
    await job.save();

    try {
      // Use existing sendEmail util which handles mock/sendgrid based on config
      if (job.userId && job.entityId) await sendTransactionalJob(job);
      else await sendEmail({ to: job.to, subject: job.subject, template: job.template, data: job.data });

      job.status = 'sent';
      job.sentAt = new Date();
      await job.save();

      res.json({ message: 'Email sent', job: safeEmailJob(job) });
    } catch (sendErr) {
      job.status = 'failed';
      job.lastError = (sendErr && sendErr.message) ? sendErr.message : String(sendErr);
      await job.save();
      console.error('[email] manual delivery attempt failed');
      res.status(500).json({ error: 'The email could not be sent. Review the job details and retry.' });
    }
  } catch (err) {
    console.error('Error in sendEmailJobNow:', err);
    res.status(500).json({ error: err.message });
  }
};
