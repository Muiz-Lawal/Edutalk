import EmailJob from '../models/EmailJob.js';

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
    const jobs = await EmailJob.find(q).sort({ createdAt: -1 }).skip(parseInt(skip)).limit(parseInt(limit));
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
    job.status = 'pending';
    job.attempts = 0;
    job.lastError = null;
    await job.save();
    res.json({ message: 'Job requeued', job });
  } catch (err) {
    console.error('Failed to retry email job:', err);
    res.status(500).json({ error: err.message });
  }
};

export const retryAllFailedEmailJobs = async (req, res) => {
  try {
    const result = await EmailJob.updateMany(
      { status: 'failed' },
      { $set: { status: 'pending', attempts: 0, lastError: null } }
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
    const job = await EmailJob.findById(jobId).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json({ job });
  } catch (err) {
    console.error('Failed to get email job details:', err);
    res.status(500).json({ error: err.message });
  }
};

import { sendEmail } from '../utils/email2.js';

export const sendEmailJobNow = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await EmailJob.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    // Increment attempt count and set sending
    job.attempts = (job.attempts || 0) + 1;
    job.status = 'sending';
    await job.save();

    try {
      // Use existing sendEmail util which handles mock/sendgrid based on config
      await sendEmail({ to: job.to, subject: job.subject, template: job.template, data: job.data, body: job.body });

      job.status = 'sent';
      job.sentAt = new Date();
      await job.save();

      res.json({ message: 'Email sent', job });
    } catch (sendErr) {
      job.status = 'failed';
      job.lastError = (sendErr && sendErr.message) ? sendErr.message : String(sendErr);
      await job.save();
      console.error('Failed to send email job now:', sendErr);
      res.status(500).json({ error: job.lastError });
    }
  } catch (err) {
    console.error('Error in sendEmailJobNow:', err);
    res.status(500).json({ error: err.message });
  }
};

// Test cleanup endpoint used by smoke/integration tests when running against a dev/test server.
export const testCleanup = async (req, res) => {
  try {
    const tokenHeader = req.headers['x-test-cleanup-token'];
    const expected = process.env.TEST_CLEANUP_TOKEN || '';

    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Not allowed in production' });
    }

    if (expected && tokenHeader !== expected) {
      return res.status(401).json({ error: 'Invalid cleanup token' });
    }

    // Use direct model deletes to remove created test artifacts
    await Promise.all([
      EmailJob.deleteMany({}),
      (await import('../models/Payment.js')).default.deleteMany({}),
      (await import('../models/Subscription.js')).default.deleteMany({}),
      (await import('../models/Class.js')).default.deleteMany({ title: { $regex: '^Integration Test Class' } }),
      (await import('../models/User.js')).default.deleteMany({ email: { $regex: '^(host\\+|student\\+)' } }),
    ]);

    res.json({ message: 'Cleanup completed' });
  } catch (err) {
    console.error('Test cleanup failed:', err);
    res.status(500).json({ error: err.message });
  }
};

// Dev-only helper: create a subscription directly (bypass payment) for testing
export const createTestSubscription = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' });

    const { userId, classId, numberOfDays = 1 } = req.body;
    if (!userId || !classId) return res.status(400).json({ error: 'userId and classId required' });

    const Subscription = (await import('../models/Subscription.js')).default;
    const ClassModel = (await import('../models/Class.js')).default;
    const UserModel = (await import('../models/User.js')).default;

    const user = await UserModel.findById(userId);
    const clazz = await ClassModel.findById(classId);
    if (!user || !clazz) return res.status(404).json({ error: 'User or Class not found' });

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + numberOfDays * 24 * 60 * 60 * 1000);

    const sub = new Subscription({
      userId: user._id,
      classId: clazz._id,
      accessCode: `TESTSUB-${Date.now()}`,
      numberOfDays,
      startDate,
      endDate,
      status: 'active',
      totalDaysPurchased: numberOfDays,
      totalAmountPaid: 0,
    });

    await sub.save();
    return res.json({ success: true, subscriptionId: sub._id });
  } catch (err) {
    console.error('createTestSubscription error:', err);
    res.status(500).json({ error: err.message });
  }
};
