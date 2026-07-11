import EmailJob from '../models/EmailJob.js';
import EmailTemplate from '../models/EmailTemplate.js';
import nodemailer from 'nodemailer';

/**
 * Email Service
 * Handles sending, scheduling, and managing emails
 */

// Initialize email transporter (configure with your provider)
let transporter = null;

const initializeTransporter = () => {
  // For development/testing, use ethereal test account
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
    });
  }

  // For production, use SendGrid or other provider
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

class EmailService {
  constructor() {
    this.transporter = initializeTransporter();
  }

  /**
   * Send an immediate email
   */
  async sendEmail(to, subject, htmlBody, options = {}) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@edutalk.app',
        to,
        subject,
        html: htmlBody,
        text: options.textBody,
        cc: options.cc,
        bcc: options.bcc,
      };

      if (!this.transporter) {
        throw new Error('Email transporter not configured');
      }

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        response: result.response,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Queue an email for sending
   */
  async queueEmail(to, subject, htmlBody, options = {}) {
    try {
      const emailJob = new EmailJob({
        to,
        subject,
        htmlBody,
        textBody: options.textBody,
        userId: options.userId,
        classId: options.classId,
        templateId: options.templateId,
        templateVariables: options.variables,
        scheduledFor: options.scheduledFor || new Date(),
        priority: options.priority || 'normal',
        metadata: options.metadata,
        tags: options.tags,
      });

      await emailJob.save();
      return emailJob;
    } catch (error) {
      console.error('Error queueing email:', error);
      throw error;
    }
  }

  /**
   * Send email from template
   */
  async sendFromTemplate(to, templateSlug, variables = {}, options = {}) {
    try {
      const template = await EmailTemplate.findOne({ slug: templateSlug, isActive: true });

      if (!template) {
        throw new Error(`Email template not found: ${templateSlug}`);
      }

      // Interpolate variables into template
      const subject = this.interpolateTemplate(template.subject, variables);
      const htmlBody = this.interpolateTemplate(template.htmlContent, variables);
      const textBody = template.textContent
        ? this.interpolateTemplate(template.textContent, variables)
        : null;

      return await this.sendEmail(to, subject, htmlBody, {
        ...options,
        textBody,
      });
    } catch (error) {
      console.error('Error sending email from template:', error);
      throw error;
    }
  }

  /**
   * Queue email from template
   */
  async queueFromTemplate(to, templateSlug, variables = {}, options = {}) {
    try {
      const template = await EmailTemplate.findOne({ slug: templateSlug, isActive: true });

      if (!template) {
        throw new Error(`Email template not found: ${templateSlug}`);
      }

      // Interpolate variables
      const subject = this.interpolateTemplate(template.subject, variables);
      const htmlBody = this.interpolateTemplate(template.htmlContent, variables);

      return await this.queueEmail(to, subject, htmlBody, {
        ...options,
        templateId: template._id,
        variables,
      });
    } catch (error) {
      console.error('Error queueing email from template:', error);
      throw error;
    }
  }

  /**
   * Process queued emails (run periodically)
   */
  async processQueue() {
    try {
      const readyJobs = await EmailJob.getReadyForSend();

      for (const job of readyJobs) {
        try {
          // Mark as sending
          job.status = 'sending';
          job.attempts += 1;
          await job.save();

          // Send email
          const result = await this.sendEmail(job.to, job.subject, job.htmlBody, {
            cc: job.cc,
            bcc: job.bcc,
            textBody: job.textBody,
          });

          // Mark as sent
          job.status = 'sent';
          job.sentAt = new Date();
          job.providerId = result.messageId;
          job.providerResponse = result.response;
          await job.save();

          // Update template usage
          if (job.templateId) {
            await EmailTemplate.findByIdAndUpdate(job.templateId, {
              $inc: { usageCount: 1 },
              lastUsed: new Date(),
            });
          }

          console.log(`✓ Email sent to ${job.to}`);
        } catch (error) {
          console.error(`✗ Failed to send email to ${job.to}:`, error.message);

          // Mark as failed
          job.status = 'failed';
          job.lastError = error.message;

          // Schedule retry
          if (job.attempts < job.maxAttempts) {
            const delay = Math.min(60000 * Math.pow(2, job.attempts), 3600000); // Exponential backoff
            job.nextRetryAt = new Date(Date.now() + delay);
            job.status = 'pending'; // Set back to pending for retry
          }

          await job.save();
        }
      }

      console.log(`Processed ${readyJobs.length} queued emails`);
      return readyJobs.length;
    } catch (error) {
      console.error('Error processing email queue:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulk(recipients, subject, htmlBody, options = {}) {
    try {
      const jobs = recipients.map(recipient => {
        const to = typeof recipient === 'string' ? recipient : recipient.email;
        const variables = typeof recipient === 'object' ? recipient.variables : {};

        return {
          to,
          subject: this.interpolateTemplate(subject, variables),
          htmlBody: this.interpolateTemplate(htmlBody, variables),
          ...options,
        };
      });

      // Queue all jobs
      const queuedJobs = await EmailJob.insertMany(
        jobs.map(job => ({
          ...job,
          scheduledFor: options.scheduledFor || new Date(),
          priority: options.priority || 'normal',
        }))
      );

      return queuedJobs;
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw error;
    }
  }

  /**
   * Interpolate template variables
   * Replaces {{variable}} with actual values
   */
  interpolateTemplate(template, variables = {}) {
    let result = template;

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });

    return result;
  }

  /**
   * Get email job status
   */
  async getJobStatus(jobId) {
    return await EmailJob.findById(jobId);
  }

  /**
   * Get job history for user
   */
  async getUserEmailHistory(userId, options = {}) {
    const query = { userId };

    if (options.status) {
      query.status = options.status;
    }

    return await EmailJob.find(query)
      .sort({ createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20);
  }

  /**
   * Get job history for class
   */
  async getClassEmailHistory(classId, options = {}) {
    const query = { classId };

    if (options.status) {
      query.status = options.status;
    }

    return await EmailJob.find(query)
      .sort({ createdAt: -1 })
      .skip(options.skip || 0)
      .limit(options.limit || 20);
  }

  /**
   * Delete old email jobs (for cleanup)
   */
  async deleteOldJobs(daysOld = 90) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await EmailJob.deleteMany({
      status: 'sent',
      sentAt: { $lt: cutoffDate },
    });

    return result.deletedCount;
  }

  /**
   * Get email stats
   */
  async getStats() {
    const stats = await EmailJob.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      sent: 0,
      failed: 0,
      bounced: 0,
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    return result;
  }
}

// Export singleton instance
export default new EmailService();
