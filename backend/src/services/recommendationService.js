import Class from '../models/Class.js';
import Subscription from '../models/Subscription.js';

class RecommendationService {
  static async getClassRecommendations({ userId, category, limit = 6 }) {
    const maxLimit = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 20);
    const recommendedClasses = [];

    const baseFilter = {
      isPublic: true,
      status: 'active',
    };

    if (category) {
      baseFilter.category = category;
    }

    const excludedClassIds = [];
    const categoryPreferences = [];
    const tagPreferences = [];

    if (userId) {
      const subscriptions = await Subscription.find({
        userId,
        status: { $in: ['active', 'expired'] },
      }).populate('classId', 'category tags');

      const categoryCounts = {};
      const tagCounts = {};

      subscriptions.forEach((subscription) => {
        const cls = subscription.classId;
        if (!cls) return;

        excludedClassIds.push(cls._id);

        if (cls.category) {
          categoryCounts[cls.category] = (categoryCounts[cls.category] || 0) + 1;
        }

        if (Array.isArray(cls.tags)) {
          cls.tags.forEach((tag) => {
            if (!tag) return;
            const normalized = String(tag).trim().toLowerCase();
            if (!normalized) return;
            tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;
          });
        }
      });

      categoryPreferences.push(
        ...Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([categoryName]) => categoryName),
      );

      tagPreferences.push(
        ...Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tagName]) => tagName),
      );
    }

    const recommendationQuery = {
      ...baseFilter,
    };

    if (excludedClassIds.length > 0) {
      recommendationQuery._id = { $nin: excludedClassIds };
    }

    const sortOrder = {
      averageRating: -1,
      totalEnrolled: -1,
      createdAt: -1,
    };

    if (userId && (categoryPreferences.length > 0 || tagPreferences.length > 0)) {
      const preferenceQuery = {
        ...recommendationQuery,
        $or: [],
      };

      if (categoryPreferences.length > 0) {
        preferenceQuery.$or.push({ category: { $in: categoryPreferences } });
      }
      if (tagPreferences.length > 0) {
        preferenceQuery.$or.push({ tags: { $in: tagPreferences } });
      }

      if (preferenceQuery.$or.length > 0) {
        const personalizedMatches = await Class.find(preferenceQuery)
          .populate('hostId', 'firstName lastName profileImage')
          .sort(sortOrder)
          .limit(maxLimit);

        recommendedClasses.push(...personalizedMatches);
      }
    }

    if (recommendedClasses.length < maxLimit) {
      const existingIds = new Set(recommendedClasses.map((cls) => cls._id.toString()));
      const fallbackQuery = {
        ...recommendationQuery,
      };

      if (existingIds.size > 0) {
        const excludedIds = [...excludedClassIds];
        existingIds.forEach((id) => {
          if (!excludedIds.some((existing) => existing.toString() === id)) {
            excludedIds.push(id);
          }
        });

        fallbackQuery._id = { $nin: excludedIds };
      }

      const fallbackMatches = await Class.find(fallbackQuery)
        .populate('hostId', 'firstName lastName profileImage')
        .sort(sortOrder)
        .limit(maxLimit - recommendedClasses.length);

      fallbackMatches.forEach((cls) => {
        if (!existingIds.has(cls._id.toString())) {
          recommendedClasses.push(cls);
        }
      });
    }

    const summary = userId
      ? 'Personalized recommendations based on your recent activity'
      : 'Popular classes recommended for all learners';

    return {
      personalized: Boolean(userId),
      summary,
      total: recommendedClasses.length,
      recommendations: recommendedClasses,
    };
  }
}

export default RecommendationService;
