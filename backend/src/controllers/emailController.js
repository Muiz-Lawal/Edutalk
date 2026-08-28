import EmailTemplate from '../models/EmailTemplate.js';
import EmailJob from '../models/EmailJob.js';
import emailService from '../services/emailService.js';

/**
 * Email Controller
 * Handles email template management and job operations
 */

// ============ TEMPLATE MANAGEMENT ============

export const createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      htmlContent,
      textContent,
      category,
      variables,
    } = req.body;

    // Create slug from name
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

    const template = new EmailTemplate({
      name,
      slug,
      description,
      subject,
      htmlContent,
      textContent,
      category,
      variables: variables || [],
      createdBy: req.user.userId,
    });

    await template.save();

    res.status(201).json({
      message: 'Email template created successfully',
      template,
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const { category, active } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }

    if (active === 'true') {
      query.isActive = true;
    }

    const templates = await EmailTemplate.find(query)
      .populate('createdBy', 'email firstName lastName')
      .sort({ createdAt: -1 });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Don't allow editing system templates
    if (template.isSystem && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Cannot edit system templates' });
    }

    Object.assign(template, req.body);
    template.updatedAt = new Date();
    await template.save();

    res.json({
      message: 'Template updated successfully',
      template,
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Don't allow deleting system templates
    if (template.isSystem && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Cannot delete system templates' });
    }

    await EmailTemplate.findByIdAndDelete(req.params.templateId);

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ EMAIL JOB MANAGEMENT ============

export const createEmailJob = async (req, res) => {
  try {
    const {
      to,
      subject,
      htmlBody,
      templateId,
      variables,
      scheduledFor,
      priority,
      cc,
      bcc,
    } = req.body;

    const job = await emailService.queueEmail(to, subject, htmlBody, {
      templateId,
      variables,
      scheduledFor,
      priority,
      cc,
      bcc,
      userId: req.user.userId,
    });

    res.status(201).json({
      message: 'Email queued successfully',
      job,
    });
  } catch (error) {
    console.error('Error creating email job:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getEmailJobs = async (req, res) => {
  try {
    const { status, limit = 20, skip = 0 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const jobs = await EmailJob.find(query)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await EmailJob.countDocuments(query);

    res.json({
      jobs,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching email jobs:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getEmailJob = async (req, res) => {
  try {
    const job = await EmailJob.findById(req.params.jobId)
      .populate('templateId')
      .populate('userId', 'email firstName lastName');

    if (!job) {
      return res.status(404).json({ message: 'Email job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching email job:', error);
    res.status(500).json({ message: error.message });
  }
};

export const retryEmailJob = async (req, res) => {
  try {
    const job = await EmailJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Email job not found' });
    }

    // Reset for retry
    job.status = 'pending';
    job.attempts = 0;
    job.nextRetryAt = new Date();
    job.lastError = null;
    await job.save();

    res.json({
      message: 'Email job queued for retry',
      job,
    });
  } catch (error) {
    console.error('Error retrying email job:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteEmailJob = async (req, res) => {
  try {
    const job = await EmailJob.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Email job not found' });
    }

    await EmailJob.findByIdAndDelete(req.params.jobId);

    res.json({ message: 'Email job deleted successfully' });
  } catch (error) {
    console.error('Error deleting email job:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ BULK OPERATIONS ============

export const sendBulkEmails = async (req, res) => {
  try {
    const {
      recipients, // Array of email strings or {email, variables}
      subject,
      htmlBody,
      scheduledFor,
      priority,
    } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients provided' });
    }

    const jobs = await emailService.sendBulk(recipients, subject, htmlBody, {
      scheduledFor,
      priority,
      userId: req.user.userId,
    });

    res.status(201).json({
      message: `${jobs.length} emails queued successfully`,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ EMAIL STATISTICS ============

export const getEmailStats = async (req, res) => {
  try {
    const stats = await emailService.getStats();

    res.json(stats);
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ USER EMAIL HISTORY ============

export const getUserEmailHistory = async (req, res) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;

    const jobs = await emailService.getUserEmailHistory(req.user.userId, {
      status,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching user email history:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ TEMPLATE PREVIEW ============

export const previewTemplate = async (req, res) => {
  try {
    const { templateId, variables = {} } = req.body;

    const template = await EmailTemplate.findById(templateId);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Interpolate variables
    const subject = emailService.interpolateTemplate(template.subject, variables);
    const htmlContent = emailService.interpolateTemplate(template.htmlContent, variables);
    const textContent = emailService.interpolateTemplate(template.textContent || '', variables);

    res.json({
      subject,
      htmlContent,
      textContent,
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({ message: error.message });
  }
};

// ============ ADMIN OPERATIONS ============

export const processEmailQueue = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const processed = await emailService.processQueue();

    res.json({
      message: `Processed ${processed} queued emails`,
      count: processed,
    });
  } catch (error) {
    console.error('Error processing email queue:', error);
    res.status(500).json({ message: error.message });
  }
};

export const cleanupOldEmails = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { daysOld = 90 } = req.body;
    const deleted = await emailService.deleteOldJobs(daysOld);

    res.json({
      message: `Deleted ${deleted} old email jobs`,
      count: deleted,
    });
  } catch (error) {
    console.error('Error cleaning up old emails:', error);
    res.status(500).json({ message: error.message });
  }
};
