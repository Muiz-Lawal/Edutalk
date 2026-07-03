import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  // Achievement Definition (for reference)
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    required: true,
    maxlength: 200
  },
  type: {
    type: String,
    enum: [
      'first_session',
      'session_attendance',
      'course_completion',
      'perfect_score',
      'streak_master',
      'top_performer',
      'speed_runner',
      'engagement_champion',
      'community_helper',
      'milestone_reached'
    ],
    required: true,
    index: true
  },

  // Award Details
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    index: true
  },
  bundleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bundle'
  },

  // Criteria
  criteria: {
    type: {
      type: String,
      enum: ['attendance', 'score', 'streak', 'completion', 'time', 'engagement', 'custom'],
      required: true
    },
    threshold: Number, // e.g., 100 for perfect score, 10 for 10 sessions
    condition: String, // Description of condition
    metric: String // Which metric to measure
  },

  // Achievement Icon/Badge
  icon: {
    type: String // URL or SVG data
  },
  badgeColor: {
    type: String,
    default: '#FFD700' // Gold by default
  },
  badgeSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },

  // Award Details
  awardedAt: {
    type: Date,
    default: Date.now
  },
  earnedCount: {
    type: Number,
    default: 1
  },
  isRepeatable: {
    type: Boolean,
    default: false
  },

  // Display Settings
  displayOnProfile: {
    type: Boolean,
    default: true
  },
  displayOnLeaderboard: {
    type: Boolean,
    default: true
  },

  // Metadata
  notificationSent: {
    type: Boolean,
    default: false
  },
  notificationSentAt: Date,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for frequent queries
achievementSchema.index({ studentId: 1, classId: 1 });
achievementSchema.index({ studentId: 1, awardedAt: -1 });
achievementSchema.index({ classId: 1, type: 1 });
achievementSchema.index({ displayOnProfile: 1 });

// Virtual: Display name with earned count
achievementSchema.virtual('displayName').get(function() {
  if (this.earnedCount > 1 && this.isRepeatable) {
    return `${this.name} (x${this.earnedCount})`;
  }
  return this.name;
});

// Static: Get achievement template by type
achievementSchema.statics.getTemplate = function(type) {
  const templates = {
    first_session: {
      name: 'First Step',
      description: 'Completed your first class session',
      type: 'first_session',
      criteria: {
        type: 'attendance',
        threshold: 1,
        condition: 'Attend at least 1 session',
        metric: 'sessionsAttended'
      },
      badgeColor: '#4CAF50',
      isRepeatable: false
    },
    session_attendance: {
      name: 'Committed Learner',
      description: 'Attended 10+ class sessions',
      type: 'session_attendance',
      criteria: {
        type: 'attendance',
        threshold: 10,
        condition: 'Attend at least 10 sessions',
        metric: 'sessionsAttended'
      },
      badgeColor: '#2196F3',
      isRepeatable: true
    },
    course_completion: {
      name: 'Course Master',
      description: 'Completed an entire course',
      type: 'course_completion',
      criteria: {
        type: 'completion',
        threshold: 100,
        condition: 'Reach 100% course completion',
        metric: 'completionPercentage'
      },
      badgeColor: '#FF9800',
      isRepeatable: true
    },
    perfect_score: {
      name: 'Perfect Score',
      description: 'Achieved 100% on a quiz',
      type: 'perfect_score',
      criteria: {
        type: 'score',
        threshold: 100,
        condition: 'Score 100% on any quiz',
        metric: 'quizScore'
      },
      badgeColor: '#FFD700',
      isRepeatable: true
    },
    streak_master: {
      name: 'Streak Master',
      description: 'Attended 7 consecutive sessions',
      type: 'streak_master',
      criteria: {
        type: 'streak',
        threshold: 7,
        condition: 'Attend 7 consecutive sessions',
        metric: 'attendanceStreak'
      },
      badgeColor: '#9C27B0',
      isRepeatable: true
    },
    top_performer: {
      name: 'Top Performer',
      description: 'Ranked in top 5 of your class',
      type: 'top_performer',
      criteria: {
        type: 'score',
        threshold: 80,
        condition: 'Average score above 80%',
        metric: 'averageScore'
      },
      badgeColor: '#E91E63',
      isRepeatable: true
    },
    speed_runner: {
      name: 'Speed Runner',
      description: 'Completed course in record time',
      type: 'speed_runner',
      criteria: {
        type: 'time',
        threshold: 14,
        condition: 'Complete in 14 days or less',
        metric: 'daysToCompletion'
      },
      badgeColor: '#00BCD4',
      isRepeatable: true
    },
    engagement_champion: {
      name: 'Engagement Champion',
      description: 'High engagement score (80+)',
      type: 'engagement_champion',
      criteria: {
        type: 'engagement',
        threshold: 80,
        condition: 'Maintain engagement score of 80+',
        metric: 'engagementScore'
      },
      badgeColor: '#8BC34A',
      isRepeatable: false
    },
    community_helper: {
      name: 'Community Helper',
      description: 'Helped peers with questions',
      type: 'community_helper',
      criteria: {
        type: 'custom',
        threshold: 5,
        condition: 'Help 5+ peers',
        metric: 'helpCount'
      },
      badgeColor: '#00ACC1',
      isRepeatable: true
    },
    milestone_reached: {
      name: 'Milestone Reached',
      description: 'Achieved significant progress',
      type: 'milestone_reached',
      criteria: {
        type: 'completion',
        threshold: 50,
        condition: 'Reach 50% course completion',
        metric: 'completionPercentage'
      },
      badgeColor: '#FFC107',
      isRepeatable: false
    },
    // Badges (points-based tiers)
    badge_bronze: {
      name: 'Bronze Supporter',
      description: 'Reached 100 points',
      type: 'badge_bronze',
      criteria: { type: 'custom', threshold: 100, condition: 'Points >= 100', metric: 'points' },
      badgeColor: '#cd7f32',
      isRepeatable: false
    },
    badge_silver: {
      name: 'Silver Supporter',
      description: 'Reached 500 points',
      type: 'badge_silver',
      criteria: { type: 'custom', threshold: 500, condition: 'Points >= 500', metric: 'points' },
      badgeColor: '#C0C0C0',
      isRepeatable: false
    },
    badge_gold: {
      name: 'Gold Supporter',
      description: 'Reached 1000 points',
      type: 'badge_gold',
      criteria: { type: 'custom', threshold: 1000, condition: 'Points >= 1000', metric: 'points' },
      badgeColor: '#FFD700',
      isRepeatable: false
    }
  };

  return templates[type] || null;
};

// Method: Mark notification as sent
achievementSchema.methods.markNotificationSent = function() {
  this.notificationSent = true;
  this.notificationSentAt = new Date();
  return this.save();
};

// Method: Increment earned count (for repeatable achievements)
achievementSchema.methods.incrementEarnCount = function() {
  if (this.isRepeatable) {
    this.earnedCount += 1;
    return this.save();
  }
  return this;
};

// Method: Get achievement details
achievementSchema.methods.getDetails = function() {
  return {
    name: this.name,
    description: this.description,
    type: this.type,
    icon: this.icon,
    badgeColor: this.badgeColor,
    awardedAt: this.awardedAt,
    earnedCount: this.earnedCount,
    isRepeatable: this.isRepeatable,
    displayName: this.displayName
  };
};

// Static: Check if achievement should be awarded
achievementSchema.statics.checkAndAward = async function(studentId, classId, progressData) {
  const Achievement = this;
  const awardedAchievements = [];

  // Check each achievement type
  const achievementTypes = [
    'first_session',
    'session_attendance',
    'course_completion',
    'perfect_score',
    'streak_master',
    'top_performer',
    'speed_runner',
    'engagement_champion'
  ];

  for (const type of achievementTypes) {
    const template = Achievement.getTemplate(type);
    if (!template) continue;

    let shouldAward = false;
    const { criteria } = template;

    // Check criteria
    switch (criteria.type) {
      case 'attendance':
        shouldAward = progressData.sessionsAttended >= criteria.threshold;
        break;
      case 'score':
        shouldAward = progressData.averageScore >= criteria.threshold;
        break;
      case 'completion':
        shouldAward = progressData.completionPercentage >= criteria.threshold;
        break;
      case 'engagement':
        shouldAward = progressData.engagementScore >= criteria.threshold;
        break;
      case 'streak':
        shouldAward = progressData.attendanceStreak >= criteria.threshold;
        break;
      case 'time':
        shouldAward = progressData.daysToCompletion <= criteria.threshold;
        break;
    }

    if (shouldAward) {
      // Check if already earned (for non-repeatable)
      if (!template.isRepeatable) {
        const existing = await Achievement.findOne({
          studentId,
          classId,
          type,
          isRepeatable: false
        });

        if (existing) continue; // Already earned
      }

      // Award achievement within a transaction
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const achievement = new Achievement({
          ...template,
          studentId,
          classId,
          awardedAt: new Date()
        });

        await achievement.save({ session });

        // Record points for the award
        try {
          const points = template.isRepeatable ? 10 : 25;
          // Lazy require to avoid potential circular imports at module load
          const PointsLedger = await import('./PointsLedger.js');
          if (PointsLedger && PointsLedger.default && typeof PointsLedger.default.record === 'function') {
            await PointsLedger.default.record({
              userId: studentId,
              amount: points,
              type: 'achievement',
              classId,
              referenceId: achievement._id,
              description: `Awarded achievement: ${template.name}`,
              session,
            });
          }
        } catch (err) {
          // If points recording fails, abort transaction
          await session.abortTransaction();
          session.endSession();
          console.warn('Failed to record points for achievement:', err.message);
          continue; // continue to next achievement type
        }

        // Create notification and enqueue email job (if preference allows)
        try {
          const Notification = await import('./Notification.js');
          const User = await import('./User.js');
          const EmailJob = await import('./EmailJob.js');

          const notificationDoc = new Notification.default({
            userId: studentId,
            type: 'achievement_unlocked',
            title: `Achievement Unlocked: ${template.name}`,
            message: template.description,
            relatedClassId: classId,
            metadata: {
              achievementId: achievement._id,
              points: template.isRepeatable ? 10 : 25,
            },
          });

          await notificationDoc.save({ session });

          // Enqueue email job inside the same transaction so notification + job are atomic
          try {
            const userDoc = await User.default.findById(studentId).select('email emailPreferences firstName');
            if (userDoc && userDoc.email && userDoc.emailPreferences?.achievementNotifications !== false) {
              const subject = `Achievement Unlocked: ${template.name}`;
              const body = notificationDoc.message || '';
              const job = new EmailJob.default({
                to: userDoc.email,
                subject,
                body,
                template: 'achievement_unlocked',
                data: {
                  userName: userDoc.firstName,
                  achievementName: template.name,
                  description: template.description,
                  points: template.isRepeatable ? 10 : 25,
                  classId,
                },
                status: 'pending',
              });

              await job.save({ session });
            }
          } catch (jobErr) {
            // If enqueueing fails, abort transaction
            await session.abortTransaction();
            session.endSession();
            console.warn('Failed to enqueue email job for achievement:', jobErr.message);
            continue;
          }

          // Commit transaction before external side-effects
          await session.commitTransaction();
          session.endSession();

          // Emit socket notification to the user if socket.io is available
          try {
            const socketUtil = await import('../utils/socketInstance.js');
            const io = socketUtil.getIO && socketUtil.getIO();
            if (io) {
              io.to(`user:${studentId}`).emit('notification', notificationDoc);
            }
          } catch (socketErr) {
            console.warn('Failed to emit socket notification:', socketErr.message);
          }
        } catch (emailErr) {
          // If notification save failed, abort transaction and continue
          try { await session.abortTransaction(); } catch(e){}
          try { session.endSession(); } catch(e){}
          console.warn('Failed to create/send achievement notification:', emailErr.message);
          continue;
        }
      } catch (txErr) {
        try { await session.abortTransaction(); } catch(e){}
        session.endSession();
        console.warn('Transaction failed for achievement award:', txErr.message);
        continue;
      }

      awardedAchievements.push(achievement);
    }
  }

  return awardedAchievements;
};

export default mongoose.model('Achievement', achievementSchema);
