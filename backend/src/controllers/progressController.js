import StudentProgress from '../models/StudentProgress.js';
import Achievement from '../models/Achievement.js';
import ProgressMetrics from '../models/ProgressMetrics.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';

// Get student progress for single enrollment
export const getStudentProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    // Verify ownership or admin
    const subscription = await Subscription.findById(enrollmentId);
    if (!subscription) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (subscription.studentId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const progress = await StudentProgress.findOne({ enrollmentId })
      .populate('classId', 'title description category')
      .populate('studentId', 'firstName lastName email')
      .lean();

    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching student progress:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

// Get class-wide progress statistics
export const getClassProgress = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify class exists and user has access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    if (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const progressRecords = await StudentProgress.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .lean();

    if (progressRecords.length === 0) {
      return res.json({
        success: true,
        data: {
          totalStudents: 0,
          completedCount: 0,
          averageCompletion: 0,
          averageScore: 0,
          averageEngagement: 0,
          students: []
        }
      });
    }

    // Calculate aggregates
    const totalStudents = progressRecords.length;
    const completedCount = progressRecords.filter(p => p.status === 'completed').length;
    const averageCompletion = Math.round(
      (progressRecords.reduce((sum, p) => sum + p.completionPercentage, 0) / totalStudents) * 100
    ) / 100;
    const averageScore = Math.round(
      (progressRecords.reduce((sum, p) => sum + (p.overallScore || 0), 0) / totalStudents) * 100
    ) / 100;
    const averageEngagement = Math.round(
      (progressRecords.reduce((sum, p) => sum + p.engagementScore, 0) / totalStudents) * 100
    ) / 100;
    const completionDistribution = [
      progressRecords.filter(p => p.completionPercentage < 25).length,
      progressRecords.filter(p => p.completionPercentage >= 25 && p.completionPercentage < 50).length,
      progressRecords.filter(p => p.completionPercentage >= 50 && p.completionPercentage < 75).length,
      progressRecords.filter(p => p.completionPercentage >= 75).length
    ];
    const avgAttendance = Math.round(
      (progressRecords.reduce((sum, p) => sum + (p.sessionsTotal ? (p.sessionsAttended / p.sessionsTotal) * 100 : 0), 0) / totalStudents) * 100
    ) / 100;
    const quizCompletionRate = Math.round(
      (progressRecords.filter(p => p.quizzesTaken > 0).length / totalStudents) * 100
    );
    const avgSessionDuration = Math.round(
      (progressRecords.reduce((sum, p) => sum + (p.averageSessionDuration || 0), 0) / totalStudents) * 100
    ) / 100;
    const atRiskStudents = progressRecords
      .filter(p => p.completionPercentage < 50 && p.status !== 'completed' && p.status !== 'dropped')
      .map(p => ({
        studentId: p.studentId._id,
        name: `${p.studentId.firstName} ${p.studentId.lastName}`,
        completion: p.completionPercentage,
        score: p.overallScore || 0,
        engagement: p.engagementScore,
        status: p.status,
        sessionsAttended: p.sessionsAttended,
        lastAccessed: p.lastAccessed
      }));

    res.json({
      success: true,
      data: {
        totalStudents,
        completedCount,
        completionRate: Math.round((completedCount / totalStudents) * 100 * 100) / 100,
        averageCompletion,
        averageScore,
        averageEngagement,
        completionDistribution,
        metrics: {
          avgAttendance,
          quizCompletion: quizCompletionRate,
          participationRate: averageEngagement,
          avgSessionDuration
        },
        atRiskStudents,
        students: progressRecords.map(p => ({
          studentId: p.studentId._id,
          name: `${p.studentId.firstName} ${p.studentId.lastName}`,
          completion: p.completionPercentage,
          score: p.overallScore || 0,
          engagement: p.engagementScore,
          status: p.status,
          sessionsAttended: p.sessionsAttended,
          lastAccessed: p.lastAccessed
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching class progress:', error);
    res.status(500).json({ message: 'Error fetching class progress', error: error.message });
  }
};

// Update student progress (mark attendance, record scores, etc.)
export const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { type, data } = req.body; // type: 'attendance' | 'score' | 'completion'

    let progress = await StudentProgress.findOne({ enrollmentId });
    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Verify authorization (only student, host, or admin)
    const subscription = await Subscription.findById(enrollmentId);
    const isStudent = subscription.studentId.toString() === req.user.id;
    const isHost = progress.classId && (await Class.findById(progress.classId)).hostId.toString() === req.user.id;

    if (!isStudent && !isHost && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    switch (type) {
      case 'attendance':
        await progress.recordAttendance(data);
        break;
      case 'score':
        await progress.recordAssessmentScore(data);
        break;
      case 'completion':
        await progress.updateCompletion(data.percentage);
        break;
      default:
        return res.status(400).json({ message: 'Invalid update type' });
    }

    // Check for achievements after update
    const achievements = await Achievement.checkAndAward(
      progress.studentId,
      progress.classId,
      progress.toObject()
    );

    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress.getProgressSummary(),
      achievementsEarned: achievements
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
};

// Get detailed progress analytics for a class
export const getProgressAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    let { days, period = 'week' } = req.query;
    const periodMap = {
      week: 7,
      month: 30,
      all: 365
    };

    days = parseInt(days, 10);
    if (!days || days <= 0) {
      days = periodMap[period] || 7;
    }

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc || (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Get metrics for date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await ProgressMetrics.getMetricsRange(classId, startDate, new Date());

    // Get latest progress records
    const progressRecords = await StudentProgress.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .lean();

    const latestMetrics = metrics.length > 0 ? metrics[metrics.length - 1].getSummary() : null;
    const totalStudents = progressRecords.length;
    const passedStudents = progressRecords.filter(p => p.status === 'completed').length;
    const newStudents = progressRecords.filter(p => new Date(p.createdAt) >= startDate).length;
    const atRiskStudents = progressRecords
      .filter(p => p.completionPercentage < 50 && p.status !== 'completed' && p.status !== 'dropped')
      .map(p => ({
        studentId: p.studentId?._id || p.studentId,
        name: p.studentId?.firstName ? `${p.studentId.firstName} ${p.studentId.lastName}` : 'Student',
        email: p.studentId?.email || '',
        completion: p.completionPercentage,
        engagement: p.engagementScore,
        status: p.status,
        lastAccessed: p.lastAccessed,
        riskScore: Math.max(0, 100 - (p.engagementScore || 0)),
        recommendation: p.completionPercentage === 0 ? 'Contact student directly' : 'Recommend review session'
      }));

    const performanceDistribution = [
      progressRecords.filter(p => p.overallScore >= 90).length,
      progressRecords.filter(p => p.overallScore >= 70 && p.overallScore < 90).length,
      progressRecords.filter(p => p.overallScore >= 50 && p.overallScore < 70).length,
      progressRecords.filter(p => p.overallScore < 50).length
    ];

    res.json({
      success: true,
      data: {
        metricsOverTime: metrics.map(m => m.getSummary()),
        dailyMetrics: metrics.map(m => m.getSummary()),
        currentStats: latestMetrics,
        progressRecords,
        dateRange: { start: startDate, end: new Date() },
        totalStudents,
        passedStudents,
        newStudents,
        avgCompletionRate: latestMetrics?.completionRate || 0,
        completionTrend: latestMetrics?.completionTrend || 0,
        avgEngagement: latestMetrics?.averageEngagementScore || 0,
        performanceDistribution,
        metrics: {
          attendanceRate: latestMetrics?.averageSessionAttendance || 0,
          quizCompletion: latestMetrics?.completionRate || 0,
          participationRate: latestMetrics?.averageEngagementScore || 0,
          avgSessionDuration: latestMetrics?.averageSessionDuration || 0
        },
        atRiskStudents
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Get at-risk students
export const getAtRiskStudents = async (req, res) => {
  try {
    const { classId } = req.params;
    const { threshold = 50 } = req.query; // completion percentage threshold

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc || (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const atRiskStudents = await StudentProgress.find({
      classId,
      completionPercentage: { $lt: parseInt(threshold) },
      status: { $ne: 'completed', $ne: 'dropped' }
    }).populate('studentId', 'firstName lastName email')
      .sort({ completionPercentage: 1 });

    // Add risk score and recommendations
    const enrichedStudents = atRiskStudents.map(student => {
      const riskScore = 100 - student.engagementScore;
      const lastAccessDays = Math.floor((Date.now() - (student.lastAccessed || student.startedAt)) / (1000 * 60 * 60 * 24));
      
      let recommendation = 'Monitor progress';
      if (lastAccessDays > 7) recommendation = 'Send reminder email';
      if (student.completionPercentage === 0) recommendation = 'Contact student directly';
      if (student.engagementScore < 30) recommendation = 'Schedule 1:1 meeting';

      return {
        studentId: student.studentId._id,
        name: `${student.studentId.firstName} ${student.studentId.lastName}`,
        email: student.studentId.email,
        completion: student.completionPercentage,
        engagement: student.engagementScore,
        riskScore,
        lastAccessed: student.lastAccessed,
        daysInactive: lastAccessDays,
        sessionsAttended: student.sessionsAttended,
        recommendation
      };
    });

    res.json({
      success: true,
      data: enrichedStudents
    });
  } catch (error) {
    console.error('Error fetching at-risk students:', error);
    res.status(500).json({ message: 'Error fetching at-risk students', error: error.message });
  }
};

// Predict completion date
export const predictCompletion = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    const progress = await StudentProgress.findOne({ enrollmentId });
    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Verify authorization
    const subscription = await Subscription.findById(enrollmentId);
    if (!subscription || (subscription.studentId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Safe date handling
    const startDate = progress.startedAt ? new Date(progress.startedAt) : new Date(progress.createdAt);
    if (!startDate || isNaN(startDate.getTime())) {
      return res.status(400).json({ message: 'Invalid start date in progress record' });
    }

    const daysElapsed = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const completionPct = progress.completionPercentage || 0;
    const currentPace = completionPct > 0 ? Math.round((completionPct / daysElapsed) * 100) / 100 : 0;

    const prediction = {
      estimatedCompletionDate: progress.estimatedCompletionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      daysToCompletion: progress.daysToCompletion || 30,
      currentCompletion: completionPct,
      currentPace: currentPace, // % per day
      status: progress.status || 'in_progress',
      confidence: (progress.daysToCompletion && completionPct > 0) ? 'high' : 'low'
    };

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Error predicting completion:', error.message, error.stack);
    res.status(500).json({ message: 'Error predicting completion', error: error.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { sessionId, duration, notes } = req.body;

    if (!sessionId || !duration) {
      return res.status(400).json({ message: 'sessionId and duration are required' });
    }

    let progress = await StudentProgress.findOne({ enrollmentId });
    if (!progress) {
      // Create new progress if doesn't exist
      const subscription = await Subscription.findById(enrollmentId);
      progress = new StudentProgress({
        enrollmentId,
        classId: subscription.classId,
        studentId: subscription.studentId,
        bundleId: subscription.bundleId
      });
    }

    await progress.recordAttendance({ sessionId, duration, notes });

    res.json({
      success: true,
      message: 'Attendance recorded',
      data: progress.getProgressSummary()
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ message: 'Error marking attendance', error: error.message });
  }
};

// Get progress leaderboard for a class
export const getLeaderboard = async (req, res) => {
  try {
    const { classId } = req.params;
    const { sortBy = 'score', limit = 50 } = req.query;

    const progressRecords = await StudentProgress.find({ classId })
      .populate('studentId', 'firstName lastName')
      .lean();

    if (progressRecords.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Sort based on criteria
    let sorted = [...progressRecords];
    switch (sortBy) {
      case 'score':
        sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
        break;
      case 'completion':
        sorted.sort((a, b) => b.completionPercentage - a.completionPercentage);
        break;
      case 'engagement':
        sorted.sort((a, b) => b.engagementScore - a.engagementScore);
        break;
      case 'time':
        sorted.sort((a, b) => b.totalTimeSpent - a.totalTimeSpent);
        break;
    }

    const leaderboard = sorted.slice(0, parseInt(limit)).map((p, index) => ({
      rank: index + 1,
      studentId: p.studentId._id,
      name: `${p.studentId.firstName} ${p.studentId.lastName}`,
      score: p.overallScore || 0,
      completion: p.completionPercentage,
      engagement: p.engagementScore,
      timeSpent: Math.round(p.totalTimeSpent / 60), // hours
      sessions: p.sessionsAttended,
      status: p.status
    }));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};

// Get progress for student across all classes
export const getStudentAllProgress = async (req, res) => {
  try {
    const userId = req.params.studentId || req.user.id;

    // Verify authorization
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const progressRecords = await StudentProgress.find({ studentId: userId })
      .populate('classId', 'title description')
      .populate('bundleId', 'title')
      .lean({ virtuals: true });

    const enrichedRecords = progressRecords.map((record) => {
      const classTitle = record.classId?.title || record.classId?.courseTitle || 'Untitled Course';
      const estimatedCompletionDate = record.estimatedCompletionDate ? new Date(record.estimatedCompletionDate) : null;
      const daysElapsed = record.startedAt ? Math.ceil((Date.now() - new Date(record.startedAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
      const daysRemaining = record.daysToCompletion != null ? record.daysToCompletion : null;
      const activities = [
        ...(record.sessionAttendance || []).slice(-3).map((session) => ({
          type: 'Session',
          label: session.participationLevel ? `Attended ${session.participationLevel}` : 'Attended session',
          value: session.duration ? `${session.duration} min` : 'Completed',
          date: session.attendedAt || record.lastAccessed,
        })),
        ...(record.assessmentScores || []).slice(-3).map((assessment) => ({
          type: 'Assessment',
          label: assessment.assessmentTitle || 'Assessment',
          value: `${assessment.score ?? 0}/${assessment.maxScore ?? 0}`,
          date: assessment.completedAt,
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        enrollmentId: record.enrollmentId,
        className: classTitle,
        classDescription: record.classId?.description || '',
        completionPercentage: record.completionPercentage || 0,
        currentGrade: record.overallScore != null ? `${record.overallScore}%` : 'N/A',
        engagementScore: record.engagementScore != null ? record.engagementScore : 0,
        estimatedCompletionDate,
        daysElapsed,
        daysRemaining,
        status: record.status,
        activities,
        progressSummary: record,
      };
    });

    res.json({
      success: true,
      data: enrichedRecords
    });
  } catch (error) {
    console.error('Error fetching all progress:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

// Export progress data for compliance
export const exportProgressReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const { format = 'json' } = req.query; // json, csv, pdf

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc || (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const progressRecords = await StudentProgress.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .populate('classId', 'title')
      .lean();

    if (format === 'csv') {
      // Create CSV content
      const headers = ['Student Name', 'Email', 'Completion %', 'Score', 'Engagement', 'Status', 'Sessions Attended', 'Time Spent (hours)'];
      const rows = progressRecords.map(p => [
        `${p.studentId.firstName} ${p.studentId.lastName}`,
        p.studentId.email,
        p.completionPercentage,
        p.overallScore || 0,
        p.engagementScore,
        p.status,
        p.sessionsAttended,
        Math.round(p.totalTimeSpent / 60)
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="progress-report.csv"');
      res.send(csv);
    } else {
      // JSON format
      res.json({
        success: true,
        data: progressRecords,
        exportDate: new Date(),
        classTitle: classDoc.title
      });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ message: 'Error exporting report', error: error.message });
  }
};
