import { sendEmail } from '../utils/email.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Subscription from '../models/Subscription.js';

class BulkEmailService {
  constructor() {
    this.maxBatchSize = 50; // Send in batches to avoid rate limits
    this.delayBetweenBatches = 1000; // 1 second delay between batches
  }

  // Send bulk email to all users
  async sendToAllUsers(subject, content, options = {}) {
    try {
      const { userType = 'all', excludeUnverified = true } = options;

      let query = {};
      if (userType === 'students') {
        query.isStudent = true;
      } else if (userType === 'hosts') {
        query.isHost = true;
      }

      if (excludeUnverified) {
        query['emailPreferences.emailVerified'] = true;
      }

      const users = await User.find(query).select('email firstName emailPreferences');
      const recipients = users.filter(user =>
        user.emailPreferences?.marketingEmails !== false ||
        options.forceSend // Admin override
      );

      return await this.sendBulkEmail(recipients, subject, content, options);
    } catch (error) {
      console.error('Error sending bulk email to all users:', error);
      throw error;
    }
  }

  // Send bulk email to class subscribers
  async sendToClassSubscribers(classId, subject, content, options = {}) {
    try {
      const subscriptions = await Subscription.find({
        classId,
        status: 'active',
      }).populate('userId', 'email firstName emailPreferences');

      const recipients = subscriptions
        .map(sub => sub.userId)
        .filter(user =>
          user.emailPreferences?.classAnnouncements !== false ||
          options.forceSend
        );

      return await this.sendBulkEmail(recipients, subject, content, options);
    } catch (error) {
      console.error('Error sending bulk email to class subscribers:', error);
      throw error;
    }
  }

  // Send bulk email to specific user segments
  async sendToSegment(segmentCriteria, subject, content, options = {}) {
    try {
      const users = await User.find(segmentCriteria).select('email firstName emailPreferences');
      const recipients = users.filter(user =>
        user.emailPreferences?.marketingEmails !== false ||
        options.forceSend
      );

      return await this.sendBulkEmail(recipients, subject, content, options);
    } catch (error) {
      console.error('Error sending bulk email to segment:', error);
      throw error;
    }
  }

  // Core bulk email sending method
  async sendBulkEmail(recipients, subject, content, options = {}) {
    const { template = 'bulk-email', data = {}, batchSize = this.maxBatchSize } = options;

    const results = {
      total: recipients.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchPromises = batch.map(async (user) => {
        try {
          await sendEmail({
            to: user.email,
            subject,
            template,
            data: {
              firstName: user.firstName,
              content,
              ...data,
            },
          });
          results.sent++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            email: user.email,
            error: error.message,
          });
        }
      });

      await Promise.all(batchPromises);

      // Delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }

    return results;
  }

  // Get email statistics
  async getEmailStats() {
    try {
      const totalUsers = await User.countDocuments();
      const verifiedUsers = await User.countDocuments({ 'emailPreferences.emailVerified': true });
      const marketingOptIns = await User.countDocuments({ 'emailPreferences.marketingEmails': true });
      const sessionReminders = await User.countDocuments({ 'emailPreferences.sessionReminders': { $ne: false } });
      const expiryWarnings = await User.countDocuments({ 'emailPreferences.subscriptionExpiry': { $ne: false } });

      return {
        totalUsers,
        verifiedUsers,
        marketingOptIns,
        sessionReminders,
        expiryWarnings,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0,
        marketingOptInRate: totalUsers > 0 ? (marketingOptIns / totalUsers * 100).toFixed(1) : 0,
      };
    } catch (error) {
      console.error('Error getting email stats:', error);
      throw error;
    }
  }
}

export default new BulkEmailService();