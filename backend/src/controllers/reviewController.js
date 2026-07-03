import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import aiModerationService from '../services/aiModerationService.js';

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { classId, subscriptionId, overallRating, teachingQuality, contentRelevance, engagement, valueForMoney, pace, comment } = req.body;
    const userId = req.user.id;

    // Validate that user has access to review this class
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId,
      classId,
      status: 'active',
    });

    if (!subscription) {
      return res.status(403).json({ message: 'You must be enrolled in this class to leave a review' });
    }

    // Check if user already reviewed this class
    const existingReview = await Review.findOne({ userId, classId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this class' });
    }

    // Moderate the review content if comment is provided
    let moderationResult = null;
    if (comment && comment.trim()) {
      moderationResult = await aiModerationService.moderateReview({
        content: comment,
        userId,
        classId,
        rating: overallRating,
        timestamp: new Date(),
      });
    }

    // Create the review
    const review = new Review({
      userId,
      classId,
      subscriptionId,
      overallRating,
      teachingQuality,
      contentRelevance,
      engagement,
      valueForMoney,
      pace,
      comment: comment?.trim(),
      flagged: moderationResult?.flagged || false,
      flagReason: moderationResult?.flagged ? Object.keys(moderationResult.categories).join(', ') : null,
      approved: !moderationResult?.flagged,
    });

    await review.save();

    // Update class average rating
    await updateClassAverageRating(classId);

    // Populate user info for response
    await review.populate('userId', 'firstName lastName profileImage');

    res.status(201).json({
      review,
      moderationResult: moderationResult ? {
        approved: moderationResult.approved,
        flagged: moderationResult.flagged,
        action: moderationResult.action,
      } : null,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get reviews for a class
export const getClassReviews = async (req, res) => {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt', approvedOnly = true } = req.query;

    const query = { classId };
    if (approvedOnly === 'true') {
      query.approved = true;
    }

    const reviews = await Review.find(query)
      .populate('userId', 'firstName lastName profileImage')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching class reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const reviews = await Review.find({ userId })
      .populate('classId', 'title hostId')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ userId });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const review = await Review.findOne({ _id: id, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if review can be updated (within time limit)
    const daysSinceCreation = (Date.now() - review.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 30) {
      return res.status(400).json({ message: 'Reviews can only be updated within 30 days' });
    }

    // Moderate updated content if comment changed
    if (updates.comment && updates.comment !== review.comment) {
      const moderationResult = await aiModerationService.moderateReview({
        content: updates.comment,
        userId,
        classId: review.classId,
        rating: updates.overallRating || review.overallRating,
        timestamp: new Date(),
      });

      updates.flagged = moderationResult.flagged;
      updates.flagReason = moderationResult.flagged ? Object.keys(moderationResult.categories).join(', ') : null;
      updates.approved = !moderationResult.flagged;
    }

    Object.assign(review, updates);
    await review.save();

    // Update class average rating
    await updateClassAverageRating(review.classId);

    await review.populate('userId', 'firstName lastName profileImage');

    res.json({
      review,
      moderationResult: updates.comment ? {
        approved: review.approved,
        flagged: review.flagged,
        action: review.flagged ? 'flagged' : 'approved',
      } : null,
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findOneAndDelete({ _id: id, userId });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update class average rating
    await updateClassAverageRating(review.classId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get review statistics for a class
export const getReviewStats = async (req, res) => {
  try {
    const { classId } = req.params;

    const stats = await Review.aggregate([
      { $match: { classId: mongoose.Types.ObjectId(classId), approved: true } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$overallRating' },
          averageTeaching: { $avg: '$teachingQuality' },
          averageContent: { $avg: '$contentRelevance' },
          averageEngagement: { $avg: '$engagement' },
          averageValue: { $avg: '$valueForMoney' },
          averagePace: { $avg: '$pace' },
          ratingDistribution: {
            $push: '$overallRating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalReviews: 0,
        averageRating: 0,
        categoryAverages: {},
        ratingDistribution: {},
      });
    }

    const result = stats[0];

    // Calculate rating distribution
    const distribution = {};
    for (let i = 1; i <= 5; i++) {
      distribution[i] = result.ratingDistribution.filter(rating => rating === i).length;
    }

    res.json({
      totalReviews: result.totalReviews,
      averageRating: Math.round(result.averageRating * 10) / 10,
      categoryAverages: {
        teachingQuality: Math.round(result.averageTeaching * 10) / 10,
        contentRelevance: Math.round(result.averageContent * 10) / 10,
        engagement: Math.round(result.averageEngagement * 10) / 10,
        valueForMoney: Math.round(result.averageValue * 10) / 10,
        pace: Math.round(result.averagePace * 10) / 10,
      },
      ratingDistribution: distribution,
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update class average rating
const updateClassAverageRating = async (classId) => {
  try {
    const result = await Review.aggregate([
      { $match: { classId: mongoose.Types.ObjectId(classId), approved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$overallRating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const update = result.length > 0
      ? {
          averageRating: Math.round(result[0].averageRating * 10) / 10,
          totalReviews: result[0].totalReviews
        }
      : { averageRating: 0, totalReviews: 0 };

    await Class.findByIdAndUpdate(classId, update);
  } catch (error) {
    console.error('Error updating class average rating:', error);
  }
};