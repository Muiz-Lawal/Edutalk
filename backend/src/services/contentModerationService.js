import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class ContentModerationService {
  constructor() {
    this.moderationModel = 'text-moderation-latest';
    this.flagThreshold = 0.5; // Flag content with confidence > 50%
  }

  /**
   * Moderate user-generated content for policy violations
   */
  async moderateContent(content, contentType = 'text') {
    try {
      if (!content || content.trim().length === 0) {
        return {
          isFlagged: false,
          categories: {},
          scores: {},
          confidence: 0,
          recommendation: 'approved',
        };
      }

      // Use OpenAI Moderation API
      const response = await openai.moderations.create({
        input: content,
        model: this.moderationModel,
      });

      const result = response.results[0];
      const flagged = result.flagged;

      // Extract category scores
      const categories = result.categories;
      const scores = result.category_scores;

      // Calculate overall confidence
      const categoryScores = Object.values(scores);
      const maxScore = Math.max(...categoryScores);

      let recommendation = 'approved';
      if (flagged) {
        recommendation = this.getRecommendation(categories, scores);
      }

      return {
        isFlagged: flagged,
        categories,
        scores,
        confidence: maxScore,
        recommendation, // 'approved', 'flagged', 'review_needed', 'blocked'
        violationDetails: this.getViolationDetails(categories, scores),
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      // If moderation fails, allow content but log the error
      return {
        isFlagged: false,
        categories: {},
        scores: {},
        confidence: 0,
        recommendation: 'approved',
        error: error.message,
      };
    }
  }

  /**
   * Determine recommendation based on violation severity
   */
  getRecommendation(categories, scores) {
    const severityThresholds = {
      hate: 0.7,
      harassment: 0.7,
      self_harm: 0.9,
      sexual: 0.6,
      violence: 0.7,
    };

    // Check critical categories
    for (const [category, threshold] of Object.entries(severityThresholds)) {
      if (categories[category] && scores[category] > threshold) {
        return 'blocked'; // Automatically block severe violations
      }
    }

    // Check moderate categories
    const highScoreCategories = Object.entries(categories)
      .filter(([_, flagged]) => flagged)
      .map(([category, _]) => category);

    if (highScoreCategories.length > 2) {
      return 'blocked'; // Multiple violations = block
    }

    if (highScoreCategories.length > 0) {
      return 'review_needed'; // Single or double violation = manual review
    }

    return 'approved';
  }

  /**
   * Get human-readable violation details
   */
  getViolationDetails(categories, scores) {
    const violations = [];

    const categoryLabels = {
      hate: 'Hate Speech',
      harassment: 'Harassment',
      self_harm: 'Self Harm',
      sexual: 'Sexual Content',
      violence: 'Violence',
      illegal: 'Illegal Activity',
    };

    for (const [category, flagged] of Object.entries(categories)) {
      if (flagged && scores[category] > 0.5) {
        violations.push({
          category: categoryLabels[category] || category,
          confidence: (scores[category] * 100).toFixed(1) + '%',
          severity: this.getSeverity(scores[category]),
        });
      }
    }

    return violations;
  }

  /**
   * Categorize confidence as severity level
   */
  getSeverity(score) {
    if (score > 0.8) return 'high';
    if (score > 0.6) return 'medium';
    return 'low';
  }

  /**
   * Moderate chat message with context awareness
   */
  async moderateChatMessage(message, context = {}) {
    const fullContent = this.buildContextualContent(message, context);
    const moderation = await this.moderateContent(fullContent, 'chat');

    return {
      ...moderation,
      originalMessage: message,
      contextUsed: !!context.previousMessages,
    };
  }

  /**
   * Moderate review with context
   */
  async moderateReview(title, content, context = {}) {
    const fullContent = `Title: ${title}\n\nContent: ${content}`;
    const moderation = await this.moderateContent(fullContent, 'review');

    return {
      ...moderation,
      reviewTitle: title,
      reviewContent: content,
    };
  }

  /**
   * Build contextual content for better moderation
   */
  buildContextualContent(message, context) {
    let fullContent = message;

    if (context.previousMessages && context.previousMessages.length > 0) {
      const recentMessages = context.previousMessages.slice(-3);
      const previousContext = recentMessages
        .map(msg => `${msg.senderName}: ${msg.text}`)
        .join('\n');
      fullContent = `Previous context:\n${previousContext}\n\nCurrent message:\n${message}`;
    }

    return fullContent;
  }

  /**
   * Batch moderate multiple items (efficient for bulk operations)
   */
  async moderateBatch(items) {
    const results = [];

    // Process in batches of 5 to avoid rate limits
    for (let i = 0; i < items.length; i += 5) {
      const batch = items.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.map(item => this.moderateContent(item.content, item.type))
      );
      results.push(...batchResults);

      // Delay between batches to respect API rate limits
      if (i + 5 < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Generate moderation summary report
   */
  generateModerationReport(moderationResult) {
    const { isFlagged, recommendation, violationDetails } = moderationResult;

    if (!isFlagged) {
      return {
        status: 'approved',
        message: 'Content approved - no violations detected',
        action: 'approve',
      };
    }

    switch (recommendation) {
      case 'blocked':
        return {
          status: 'blocked',
          message: 'Content blocked due to policy violations',
          action: 'reject',
          reason: violationDetails.map(v => v.category).join(', '),
        };
      case 'review_needed':
        return {
          status: 'flagged',
          message: 'Content flagged for manual review',
          action: 'review',
          violations: violationDetails,
        };
      default:
        return {
          status: 'approved',
          message: 'Content approved after review',
          action: 'approve',
        };
    }
  }
}

export default new ContentModerationService();