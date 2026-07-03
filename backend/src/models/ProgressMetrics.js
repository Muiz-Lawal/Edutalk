import mongoose from 'mongoose';

const progressMetricsSchema = new mongoose.Schema({
  // Reference
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },

  // Date
  metricsDate: {
    type: Date,
    default: () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    },
    index: true
  },

  // Student Counts
  totalStudents: {
    type: Number,
    default: 0
  },
  completedCount: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0 // percentage
  },
  inProgressCount: {
    type: Number,
    default: 0
  },
  droppedCount: {
    type: Number,
    default: 0
  },
  droppedRate: {
    type: Number,
    default: 0 // percentage
  },

  // Performance Metrics
  averageScore: {
    type: Number,
    default: 0
  },
  medianScore: {
    type: Number,
    default: 0
  },
  scoreDistribution: {
    excellent: { type: Number, default: 0 }, // 80-100
    good: { type: Number, default: 0 },      // 60-79
    average: { type: Number, default: 0 },   // 40-59
    poor: { type: Number, default: 0 }       // 0-39
  },

  // Time Metrics
  averageTimeSpent: {
    type: Number,
    default: 0 // hours
  },
  medianTimeSpent: {
    type: Number,
    default: 0 // hours
  },
  averageSessionDuration: {
    type: Number,
    default: 0 // minutes
  },
  averageSessionAttendance: {
    type: Number,
    default: 0 // percentage
  },

  // Engagement Metrics
  averageEngagementScore: {
    type: Number,
    default: 0
  },
  highEngagementCount: {
    type: Number,
    default: 0
  },
  lowEngagementCount: {
    type: Number,
    default: 0
  },

  // At-Risk Indicators
  atRiskCount: {
    type: Number,
    default: 0 // completion < 50%
  },
  atRiskPercentage: {
    type: Number,
    default: 0
  },
  droppingTrendCount: {
    type: Number,
    default: 0 // no activity in 7 days
  },
  notAttemptedCount: {
    type: Number,
    default: 0 // 0% completion
  },

  // Trends
  weeklyCompletion: [{
    date: Date,
    rate: Number
  }],
  trendDirection: {
    type: String,
    enum: ['up', 'down', 'flat'],
    default: 'flat'
  },
  trendStrength: {
    type: Number,
    default: 0 // 0-100 percentage change
  },

  // Predictions
  predictedCompletionRate: {
    type: Number,
    default: 0 // ML-based forecast
  },
  confidenceScore: {
    type: Number,
    default: 0 // 0-100
  },

  // Demographics
  topRegions: [{
    region: String,
    studentCount: Number
  }],
  averageAge: {
    type: Number
  },
  genderDistribution: {
    male: { type: Number, default: 0 },
    female: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Certification
  certificatesIssued: {
    type: Number,
    default: 0
  },
  certificateRate: {
    type: Number,
    default: 0 // percentage of completed
  },

  // Achievement
  achievementsEarned: {
    type: Number,
    default: 0
  },
  averageAchievementsPerStudent: {
    type: Number,
    default: 0
  },

  // Revenue
  totalRevenue: {
    type: Number,
    default: 0
  },
  averageRevenuePerStudent: {
    type: Number,
    default: 0
  },

  // Metadata
  lastCalculatedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for class and date queries
progressMetricsSchema.index({ classId: 1, metricsDate: -1 });

// Virtual: Completion trend (day over day change)
progressMetricsSchema.virtual('completionTrend').get(function() {
  if (this.weeklyCompletion.length < 2) return null;
  
  const latest = this.weeklyCompletion[this.weeklyCompletion.length - 1].rate;
  const previous = this.weeklyCompletion[this.weeklyCompletion.length - 2].rate;
  
  return ((latest - previous) / previous) * 100;
});

// Method: Calculate and update all metrics
progressMetricsSchema.methods.calculateMetrics = async function(progressRecords) {
  if (!progressRecords || progressRecords.length === 0) {
    this.save();
    return;
  }

  // Student counts
  this.totalStudents = progressRecords.length;
  this.completedCount = progressRecords.filter(p => p.status === 'completed').length;
  this.inProgressCount = progressRecords.filter(p => p.status === 'in_progress').length;
  this.droppedCount = progressRecords.filter(p => p.status === 'dropped').length;
  this.notAttemptedCount = progressRecords.filter(p => p.completionPercentage === 0).length;

  // Rates
  this.completionRate = this.totalStudents > 0 
    ? Math.round((this.completedCount / this.totalStudents) * 100 * 100) / 100
    : 0;
  
  this.droppedRate = this.totalStudents > 0
    ? Math.round((this.droppedCount / this.totalStudents) * 100 * 100) / 100
    : 0;
  
  this.atRiskPercentage = this.totalStudents > 0
    ? Math.round((this.atRiskCount / this.totalStudents) * 100 * 100) / 100
    : 0;

  // Performance
  const scores = progressRecords
    .filter(p => p.overallScore !== undefined)
    .map(p => p.overallScore)
    .sort((a, b) => a - b);

  if (scores.length > 0) {
    this.averageScore = Math.round(scores.reduce((a, b) => a + b) / scores.length * 100) / 100;
    
    const mid = Math.floor(scores.length / 2);
    this.medianScore = scores.length % 2 !== 0
      ? scores[mid]
      : (scores[mid - 1] + scores[mid]) / 2;

    // Score distribution
    this.scoreDistribution.excellent = scores.filter(s => s >= 80).length;
    this.scoreDistribution.good = scores.filter(s => s >= 60 && s < 80).length;
    this.scoreDistribution.average = scores.filter(s => s >= 40 && s < 60).length;
    this.scoreDistribution.poor = scores.filter(s => s < 40).length;
  }

  // Time metrics
  const timeSpent = progressRecords
    .filter(p => p.totalTimeSpent !== undefined)
    .map(p => p.totalTimeSpent / 60); // convert to hours

  if (timeSpent.length > 0) {
    this.averageTimeSpent = Math.round(timeSpent.reduce((a, b) => a + b) / timeSpent.length * 100) / 100;
    
    const sorted = [...timeSpent].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    this.medianTimeSpent = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Engagement
  const engagementScores = progressRecords
    .filter(p => p.engagementScore !== undefined)
    .map(p => p.engagementScore);

  if (engagementScores.length > 0) {
    this.averageEngagementScore = Math.round(engagementScores.reduce((a, b) => a + b) / engagementScores.length * 100) / 100;
    this.highEngagementCount = engagementScores.filter(s => s >= 80).length;
    this.lowEngagementCount = engagementScores.filter(s => s < 60).length;
  }

  // At-risk students
  this.atRiskCount = progressRecords.filter(p => p.completionPercentage < 50).length;

  this.lastCalculatedAt = new Date();
  
  return this.save();
};

// Method: Get summary statistics
progressMetricsSchema.methods.getSummary = function() {
  return {
    date: this.metricsDate,
    totalStudents: this.totalStudents,
    completedCount: this.completedCount,
    completionRate: this.completionRate,
    averageScore: this.averageScore,
    medianScore: this.medianScore,
    averageTimeSpent: this.averageTimeSpent,
    averageEngagementScore: this.averageEngagementScore,
    atRiskCount: this.atRiskCount,
    droppedCount: this.droppedCount,
    predictedCompletionRate: this.predictedCompletionRate,
    trendDirection: this.trendDirection
  };
};

// Static: Get metrics for date range
progressMetricsSchema.statics.getMetricsRange = function(classId, startDate, endDate) {
  return this.find({
    classId,
    metricsDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ metricsDate: 1 });
};

// Static: Get latest metrics
progressMetricsSchema.statics.getLatestMetrics = function(classId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.getMetricsRange(classId, startDate, new Date());
};

export default mongoose.model('ProgressMetrics', progressMetricsSchema);
