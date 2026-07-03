import OpenAI from 'openai';
import { sendEmail } from '../utils/email.js';

class AIModerationService {
  constructor() {
    // Initialize OpenAI only if a valid API key is provided
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-your')) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error.message);
        this.openai = null;
      }
    } else {
      console.warn('OpenAI API key not configured. Using fallback moderation only.');
      this.openai = null;
    }

    // Fallback keywords for basic moderation when OpenAI is unavailable
    this.fallbackKeywords = {
      hate: ['hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'bigot'],
      violence: ['kill', 'murder', 'assault', 'attack', 'threat', 'harm'],
      harassment: ['stalk', 'harass', 'bully', 'intimidate', 'threaten'],
      spam: ['spam', 'scam', 'phishing', 'malware', 'virus'],
      inappropriate: ['nsfw', 'porn', 'sex', 'nude', 'explicit'],
    };

    this.moderationQueue = [];
    this.isProcessing = false;
  }

  // Main moderation function
  async moderateContent(content, options = {}) {
    const {
      type = 'general', // 'chat', 'review', 'profile', 'general'
      userId,
      context = {},
      strictness = 'medium', // 'low', 'medium', 'high'
    } = options;

    try {
      // Try OpenAI moderation first
      const openaiResult = await this.moderateWithOpenAI(content, type);

      if (openaiResult.flagged) {
        return {
          approved: false,
          flagged: true,
          categories: openaiResult.categories,
          confidence: openaiResult.confidence,
          method: 'openai',
          action: this.determineAction(openaiResult.categories, strictness),
        };
      }

      // Additional custom checks
      const customResult = await this.customModerationChecks(content, type, context);

      if (customResult.flagged) {
        return {
          approved: false,
          flagged: true,
          categories: customResult.categories,
          confidence: customResult.confidence,
          method: 'custom',
          action: customResult.action,
        };
      }

      return {
        approved: true,
        flagged: false,
        categories: {},
        confidence: 0,
        method: 'openai',
      };

    } catch (error) {
      console.error('OpenAI moderation failed, using fallback:', error);

      // Fallback to keyword-based moderation
      const fallbackResult = this.fallbackModeration(content);

      return {
        approved: !fallbackResult.flagged,
        flagged: fallbackResult.flagged,
        categories: fallbackResult.categories,
        confidence: fallbackResult.confidence,
        method: 'fallback',
        action: fallbackResult.action,
      };
    }
  }

  // OpenAI moderation
  async moderateWithOpenAI(content, type) {
    // If OpenAI is not configured, return no flags
    if (!this.openai) {
      return {
        flagged: false,
        categories: {},
        confidence: 0,
      };
    }

    try {
      const response = await this.openai.moderations.create({
        input: content,
      });

      const result = response.results[0];

      return {
        flagged: result.flagged,
        categories: result.categories,
        confidence: this.calculateConfidence(result.category_scores),
      };
    } catch (error) {
      console.warn('OpenAI moderation failed, falling back to custom checks:', error.message);
      // Return no flags to allow content through with fallback checks
      return {
        flagged: false,
        categories: {},
        confidence: 0,
      };
    }
  }

  // Custom moderation checks
  async customModerationChecks(content, type, context) {
    const issues = {
      flagged: false,
      categories: {},
      confidence: 0,
      action: 'none',
    };

    // Check for repeated messages (potential spam)
    if (type === 'chat' && context.recentMessages) {
      const repeatedCount = context.recentMessages.filter(msg =>
        msg.content.toLowerCase() === content.toLowerCase()
      ).length;

      if (repeatedCount >= 3) {
        issues.flagged = true;
        issues.categories.spam = true;
        issues.confidence = 0.8;
        issues.action = 'flag';
      }
    }

    // Check for excessive caps (shouting)
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.7 && content.length > 10) {
      issues.flagged = true;
      issues.categories.harassment = true;
      issues.confidence = 0.6;
      issues.action = 'warn';
    }

    // Check for suspicious links
    const linkPattern = /https?:\/\/[^\s]+/g;
    const links = content.match(linkPattern) || [];
    if (links.length > 0) {
      // Check for suspicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'goo.gl'];
      const hasSuspiciousLink = links.some(link =>
        suspiciousDomains.some(domain => link.includes(domain))
      );

      if (hasSuspiciousLink) {
        issues.flagged = true;
        issues.categories.spam = true;
        issues.confidence = 0.7;
        issues.action = 'flag';
      }
    }

    return issues;
  }

  // Fallback keyword-based moderation
  fallbackModeration(content) {
    const issues = {
      flagged: false,
      categories: {},
      confidence: 0,
      action: 'none',
    };

    const lowerContent = content.toLowerCase();

    for (const [category, keywords] of Object.entries(this.fallbackKeywords)) {
      for (const keyword of keywords) {
        if (lowerContent.includes(keyword)) {
          issues.flagged = true;
          issues.categories[category] = true;
          issues.confidence = Math.max(issues.confidence, 0.8);
          issues.action = this.determineAction({ [category]: true }, 'medium');
          break;
        }
      }
    }

    return issues;
  }

  // Calculate confidence score from OpenAI category scores
  calculateConfidence(categoryScores) {
    const scores = Object.values(categoryScores);
    return scores.length > 0 ? Math.max(...scores) : 0;
  }

  // Determine action based on categories and strictness
  determineAction(categories, strictness) {
    const severityMap = {
      low: { hate: 'warn', violence: 'flag', harassment: 'warn', spam: 'warn' },
      medium: { hate: 'block', violence: 'block', harassment: 'flag', spam: 'flag' },
      high: { hate: 'block', violence: 'block', harassment: 'block', spam: 'block' },
    };

    const actions = severityMap[strictness] || severityMap.medium;

    for (const [category, severity] of Object.entries(actions)) {
      if (categories[category]) {
        return severity;
      }
    }

    return 'none';
  }

  // Moderate chat message
  async moderateChatMessage(messageData) {
    const { content, userId, sessionId, timestamp } = messageData;

    const result = await this.moderateContent(content, {
      type: 'chat',
      userId,
      context: { sessionId, timestamp },
      strictness: 'medium',
    });

    if (result.flagged) {
      // Add to moderation queue for review
      await this.addToModerationQueue({
        id: `chat_${Date.now()}_${userId}`,
        type: 'chat_message',
        content,
        userId,
        sessionId,
        timestamp,
        moderationResult: result,
        status: 'pending',
      });
    }

    return result;
  }

  // Moderate review
  async moderateReview(reviewData) {
    const { content, userId, classId, rating, timestamp } = reviewData;

    const result = await this.moderateContent(content, {
      type: 'review',
      userId,
      context: { classId, rating },
      strictness: 'high', // Reviews need stricter moderation
    });

    if (result.flagged) {
      await this.addToModerationQueue({
        id: `review_${Date.now()}_${userId}`,
        type: 'review',
        content,
        userId,
        classId,
        rating,
        timestamp,
        moderationResult: result,
        status: 'pending',
      });
    }

    return result;
  }

  // Add content to moderation queue
  async addToModerationQueue(item) {
    this.moderationQueue.push({
      ...item,
      queuedAt: new Date(),
    });

    // Notify admins of new items in queue
    if (this.moderationQueue.length === 1) {
      await this.notifyAdminsOfQueue();
    }
  }

  // Get moderation queue
  getModerationQueue(options = {}) {
    const { status = 'all', limit = 50, offset = 0 } = options;

    let filtered = this.moderationQueue;

    if (status !== 'all') {
      filtered = filtered.filter(item => item.status === status);
    }

    return filtered
      .sort((a, b) => new Date(b.queuedAt) - new Date(a.queuedAt))
      .slice(offset, offset + limit);
  }

  // Process moderation decision
  async processModerationDecision(itemId, decision, adminId, reason = '') {
    const item = this.moderationQueue.find(item => item.id === itemId);

    if (!item) {
      throw new Error('Moderation item not found');
    }

    item.status = decision; // 'approved', 'rejected', 'escalated'
    item.processedBy = adminId;
    item.processedAt = new Date();
    item.adminReason = reason;

    // If rejected, take additional actions
    if (decision === 'rejected') {
      await this.handleRejectedContent(item);
    }

    // Remove from active queue
    this.moderationQueue = this.moderationQueue.filter(item => item.id !== itemId);

    return item;
  }

  // Handle rejected content
  async handleRejectedContent(item) {
    // Log the violation
    console.log(`Content rejected: ${item.type} by user ${item.userId}`);

    // Could implement user warnings, bans, etc. here
    // For now, just log and potentially notify user
  }

  // Notify admins of moderation queue
  async notifyAdminsOfQueue() {
    try {
      // This would send email to admins about pending moderations
      const pendingCount = this.moderationQueue.filter(item => item.status === 'pending').length;

      if (pendingCount > 0) {
        await sendEmail({
          to: process.env.ADMIN_EMAIL || 'admin@edutalk.com',
          subject: `EduTalk Moderation Queue: ${pendingCount} items pending review`,
          template: 'moderation-alert',
          data: {
            pendingCount,
            queueUrl: `${process.env.FRONTEND_URL}/admin/moderation`,
          },
        });
      }
    } catch (error) {
      console.error('Failed to notify admins:', error);
    }
  }

  // Get moderation statistics
  getModerationStats() {
    const total = this.moderationQueue.length;
    const pending = this.moderationQueue.filter(item => item.status === 'pending').length;
    const approved = this.moderationQueue.filter(item => item.status === 'approved').length;
    const rejected = this.moderationQueue.filter(item => item.status === 'rejected').length;

    return {
      total,
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? ((approved / (approved + rejected)) * 100).toFixed(1) : 0,
    };
  }

  // Bulk moderation for existing content
  async bulkModerateContent(contentArray, options = {}) {
    const results = [];

    for (const content of contentArray) {
      const result = await this.moderateContent(content.text, {
        type: content.type || 'general',
        userId: content.userId,
        ...options,
      });

      results.push({
        contentId: content.id,
        result,
      });

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }
}

export default new AIModerationService();