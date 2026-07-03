import mongoose from 'mongoose';

const studentProgressSchema = new mongoose.Schema({
  // Core References
  enrollmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bundleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bundle'
  },

  // Completion Tracking
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  sessionsAttended: {
    type: Number,
    default: 0
  },
  sessionsTotal: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },

  // Assessment Tracking
  quizzesTaken: {
    type: Number,
    default: 0
  },
  quizAverage: {
    type: Number,
    min: 0,
    max: 100
  },
  assignmentsSubmitted: {
    type: Number,
    default: 0
  },
  assignmentsTotal: {
    type: Number,
    default: 0
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100
  },

  // Time Tracking
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  },
  averageSessionDuration: {
    type: Number,
    default: 0 // in minutes
  },

  // Engagement
  engagementScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  participationLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },

  // Status
  status: {
    type: String,
    enum: ['started', 'in_progress', 'completed', 'dropped'],
    default: 'started'
  },
  dropoffReason: {
    type: String
  },

  // Session Attendance
  sessionAttendance: [{
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    attendedAt: Date,
    duration: Number, // in minutes
    participationLevel: String,
    notes: String
  }],

  // Assessment Results
  assessmentScores: [{
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    },
    assessmentTitle: String,
    score: Number,
    maxScore: Number,
    attempt: Number,
    completedAt: Date,
    feedback: String
  }],

  // Notes
  hostNotes: {
    type: String
  },
  studentNotes: {
    type: String
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Index for frequent queries
studentProgressSchema.index({ enrollmentId: 1, classId: 1 });
studentProgressSchema.index({ studentId: 1, classId: 1 });
studentProgressSchema.index({ classId: 1, status: 1 });
studentProgressSchema.index({ updatedAt: -1 });

// Virtual: Calculate days to completion estimate
studentProgressSchema.virtual('estimatedCompletionDate').get(function() {
  if (this.status === 'completed' || this.completionPercentage === 100) {
    return this.completedAt;
  }
  
  if (this.sessionsAttended === 0) return null;
  
  const remainingPercentage = 100 - this.completionPercentage;
  const percentagePerDay = this.completionPercentage / Math.ceil((Date.now() - this.startedAt) / (1000 * 60 * 60 * 24));
  
  if (percentagePerDay === 0) return null;
  
  const daysRemaining = Math.ceil(remainingPercentage / percentagePerDay);
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + daysRemaining);
  
  return estimatedDate;
});

// Virtual: Calculate completion date
studentProgressSchema.virtual('daysToCompletion').get(function() {
  if (this.completionPercentage === 100) return 0;
  if (!this.estimatedCompletionDate) return null;
  
  const days = Math.ceil((this.estimatedCompletionDate - new Date()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
});

// Method: Get progress summary
studentProgressSchema.methods.getProgressSummary = function() {
  return {
    completionPercentage: this.completionPercentage,
    status: this.status,
    sessionsAttended: this.sessionsAttended,
    sessionsTotal: this.sessionsTotal,
    quizAverage: this.quizAverage || 0,
    engagementScore: this.engagementScore,
    timeSpentHours: Math.round(this.totalTimeSpent / 60),
    lastAccessed: this.lastAccessed,
    estimatedCompletion: this.estimatedCompletionDate
  };
};

// Method: Update session attendance
studentProgressSchema.methods.recordAttendance = function(sessionData) {
  this.sessionAttendance.push({
    sessionId: sessionData.sessionId,
    attendedAt: new Date(),
    duration: sessionData.duration || 0,
    participationLevel: sessionData.participationLevel || 'medium',
    notes: sessionData.notes
  });

  this.sessionsAttended += 1;
  this.totalTimeSpent += (sessionData.duration || 0);
  
  // Recalculate engagement score
  this.recalculateEngagementScore();
  
  this.updatedAt = new Date();
  
  return this.save();
};

// Method: Record assessment score
studentProgressSchema.methods.recordAssessmentScore = function(assessmentData) {
  this.assessmentScores.push({
    assessmentId: assessmentData.assessmentId,
    assessmentTitle: assessmentData.title,
    score: assessmentData.score,
    maxScore: assessmentData.maxScore,
    attempt: assessmentData.attempt || 1,
    completedAt: new Date(),
    feedback: assessmentData.feedback
  });

  this.quizzesTaken += 1;
  
  // Recalculate quiz average
  const totalScore = this.assessmentScores.reduce((sum, a) => sum + (a.score || 0), 0);
  this.quizAverage = Math.round((totalScore / this.assessmentScores.length) * 100) / 100;
  
  // Recalculate overall score (40% quizzes, 30% attendance, 30% engagement)
  this.recalculateOverallScore();
  
  this.updatedAt = new Date();
  
  return this.save();
};

// Method: Recalculate engagement score
studentProgressSchema.methods.recalculateEngagementScore = function() {
  let score = 0;

  // 40% based on attendance rate
  if (this.sessionsTotal > 0) {
    const attendanceRate = (this.sessionsAttended / this.sessionsTotal) * 100;
    score += (attendanceRate * 0.4);
  }

  // 30% based on quiz average
  if (this.quizAverage) {
    score += (this.quizAverage * 0.3);
  }

  // 30% based on participation level and time spent
  let participationScore = 0;
  if (this.participationLevel === 'high') participationScore = 90;
  else if (this.participationLevel === 'medium') participationScore = 70;
  else participationScore = 50;
  
  score += (participationScore * 0.3);

  this.engagementScore = Math.round(score * 100) / 100;
  
  // Update participation level based on engagement
  if (this.engagementScore >= 80) this.participationLevel = 'high';
  else if (this.engagementScore >= 60) this.participationLevel = 'medium';
  else this.participationLevel = 'low';
};

// Method: Recalculate overall score
studentProgressSchema.methods.recalculateOverallScore = function() {
  let score = 0;

  // 40% quizzes
  if (this.quizAverage) {
    score += (this.quizAverage * 0.4);
  }

  // 30% attendance
  if (this.sessionsTotal > 0) {
    const attendanceRate = (this.sessionsAttended / this.sessionsTotal) * 100;
    score += (attendanceRate * 0.3);
  }

  // 30% engagement
  score += (this.engagementScore * 0.3);

  this.overallScore = Math.round(score * 100) / 100;
};

// Method: Update completion percentage
studentProgressSchema.methods.updateCompletion = function(percentage) {
  if (percentage < 0) percentage = 0;
  if (percentage > 100) percentage = 100;
  
  this.completionPercentage = percentage;

  if (percentage === 100 && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'completed';
  } else if (percentage === 0) {
    this.status = 'started';
  } else {
    this.status = 'in_progress';
  }

  this.updatedAt = new Date();
  return this.save();
};

// Method: Mark as dropped
studentProgressSchema.methods.markDropped = function(reason) {
  this.status = 'dropped';
  this.dropoffReason = reason;
  this.updatedAt = new Date();
  return this.save();
};

export default mongoose.model('StudentProgress', studentProgressSchema);
