import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  
  // Time period
  date: Date,
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
  },
  
  // Student metrics
  newEnrollments: Number,
  totalEnrolled: Number,
  activeStudents: Number,
  completionRate: Number,
  averageAttendance: Number,
  
  // Revenue metrics
  totalRevenue: Number,
  totalPayments: Number,
  averageOrderValue: Number,
  
  // Engagement metrics
  sessionsHeld: Number,
  sessionsCompleted: Number,
  averageSessionDuration: Number,
  studentEngagementScore: Number,
  chatMessagesCount: Number,
  
  // Performance
  averageRating: Number,
  reviewsReceived: Number,
  completionCertificates: Number,
  
  // Churn analysis
  churnRate: Number,
  renewalRate: Number,
  lifetimeValue: Number,
  
  // Trends
  trends: {
    enrollmentTrend: Number, // percentage change
    revenueTrend: Number,
    ratingTrend: Number,
    attendanceTrend: Number,
  },
  
  // Predictions (AI)
  predictedRevenue: Number,
  churnRiskStudents: [mongoose.Schema.Types.ObjectId],
  recommendedActions: [String],
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Analytics', analyticsSchema);
