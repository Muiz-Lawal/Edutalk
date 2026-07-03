import mongoose from 'mongoose';
import Achievement from '../models/Achievement.js';
import StudentProgress from '../models/StudentProgress.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import PointsLedger from '../models/PointsLedger.js';

// Grant achievement to student
export const grantAchievement = async (req, res) => {
  try {
    const { studentId, classId, type } = req.body;

    if (!studentId || !type) {
      return res.status(400).json({ message: 'studentId and type are required' });
    }

    // Get template
    const template = Achievement.getTemplate(type);
    if (!template) {
      return res.status(400).json({ message: 'Invalid achievement type' });
    }

    // Check if already earned (for non-repeatable)
    if (!template.isRepeatable) {
      const existing = await Achievement.findOne({
        studentId,
        classId,
        type,
        isRepeatable: false
      });

      if (existing) {
        return res.status(400).json({ message: 'Achievement already earned by this student' });
      }
    }

    // Create achievement
    const achievement = new Achievement({
      ...template,
      studentId,
      classId,
      awardedAt: new Date()
    });

    await achievement.save();

    // Populate and return
    await achievement.populate('studentId', 'firstName lastName email');
    await achievement.populate('classId', 'title');

    res.json({
      success: true,
      message: 'Achievement granted successfully',
      data: achievement.getDetails()
    });
  } catch (error) {
    console.error('Error granting achievement:', error);
    res.status(500).json({ message: 'Error granting achievement', error: error.message });
  }
};

// Get student's achievements
export const getAchievements = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classId } = req.query;

    // Verify authorization
    if (studentId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    let query = { studentId };
    if (classId) {
      query.classId = classId;
    }

    const achievements = await Achievement.find(query)
      .populate('classId', 'title')
      .sort({ awardedAt: -1 });

    // Group by type
    const grouped = {};
    achievements.forEach(ach => {
      if (!grouped[ach.type]) {
        grouped[ach.type] = [];
      }
      grouped[ach.type].push(ach.getDetails());
    });

    res.json({
      success: true,
      data: {
        achievements: achievements.map(a => a.getDetails()),
        grouped,
        totalEarned: achievements.length
      }
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
};

// Get class leaderboard with achievements
export const getLeaderboard = async (req, res) => {
  try {
    const { classId } = req.params;
    const { limit = 50, sortBy = 'points', timeRange = 'all' } = req.query;

    const metricsStartDate = new Date();
    if (timeRange === 'week') {
      metricsStartDate.setDate(metricsStartDate.getDate() - 7);
    } else if (timeRange === 'month') {
      metricsStartDate.setDate(metricsStartDate.getDate() - 30);
    } else {
      metricsStartDate.setFullYear(metricsStartDate.getFullYear() - 1);
    }

    // Get all achievements for class and optionally filter by time range
    let achievements = await Achievement.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .lean();

    if (timeRange !== 'all') {
      achievements = achievements.filter(ach => new Date(ach.awardedAt) >= metricsStartDate);
    }

    // Group by student and count
    const studentAchievements = {};
    achievements.forEach(ach => {
      const studentId = ach.studentId._id.toString();
      if (!studentAchievements[studentId]) {
        studentAchievements[studentId] = {
          studentId: ach.studentId._id,
          name: `${ach.studentId.firstName} ${ach.studentId.lastName}`,
          email: ach.studentId.email,
          achievements: [],
          totalAchievements: 0,
          points: 0
        };
      }
      studentAchievements[studentId].achievements.push({
        name: ach.name,
        type: ach.type,
        icon: ach.icon,
        awardedAt: ach.awardedAt
      });
      studentAchievements[studentId].totalAchievements += 1;
    });

    // Collect student IDs to compute PointsLedger balances
    const studentIds = Object.keys(studentAchievements).map(id => mongoose.Types.ObjectId(id));

    // Get points balances from PointsLedger (aggregate across all classes)
    let ledgerResults = [];
    if (studentIds.length > 0) {
      ledgerResults = await PointsLedger.aggregate([
        { $match: { userId: { $in: studentIds } } },
        { $group: { _id: '$userId', balance: { $sum: '$amount' } } }
      ]);
    }

    const ledgerMap = {};
    ledgerResults.forEach(r => {
      ledgerMap[r._id.toString()] = r.balance;
    });

    // Get progress data for additional metrics
    const progressRecords = await StudentProgress.find({ classId })
      .lean();

    const progressMap = {};
    progressRecords.forEach(p => {
      const studentId = p.studentId.toString();
      progressMap[studentId] = {
        score: p.overallScore || 0,
        completion: p.completionPercentage,
        engagement: p.engagementScore
      };
    });

    // Combine and sort
    const leaderboard = Object.values(studentAchievements)
      .map(student => ({
        ...student,
        score: progressMap[student.studentId.toString()]?.score || 0,
        completion: progressMap[student.studentId.toString()]?.completion || 0,
        participation: progressMap[student.studentId.toString()]?.engagement || 0,
        points: ledgerMap[student.studentId.toString()] || 0
      }))
      .sort((a, b) => {
        switch (sortBy) {
          case 'completion':
            return (b.completion || 0) - (a.completion || 0);
          case 'participation':
            return (b.participation || 0) - (a.participation || 0);
          case 'achievements':
            return (b.totalAchievements || 0) - (a.totalAchievements || 0);
          case 'points':
          default:
            return (b.points || 0) - (a.points || 0);
        }
      })
      .slice(0, parseInt(limit))
      .map((s, idx) => ({
        ...s,
        rank: idx + 1
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

// Check and auto-award achievements
export const checkMilestones = async (req, res) => {
  try {
    const { enrollmentId } = req.params;

    // Get progress
    const progress = await StudentProgress.findOne({ enrollmentId });
    if (!progress) {
      return res.status(404).json({ message: 'Progress record not found' });
    }

    // Check for achievements
    const awardedAchievements = await Achievement.checkAndAward(
      progress.studentId,
      progress.classId,
      progress.toObject()
    );

    // Mark notifications as sent
    for (const ach of awardedAchievements) {
      await ach.markNotificationSent();
    }

    res.json({
      success: true,
      message: 'Milestones checked',
      data: {
        achievementsEarned: awardedAchievements.map(a => a.getDetails()),
        count: awardedAchievements.length
      }
    });
  } catch (error) {
    console.error('Error checking milestones:', error);
    res.status(500).json({ message: 'Error checking milestones', error: error.message });
  }
};

// Get all badge definitions
export const getAllBadges = async (req, res) => {
  try {
    const achievementTypes = [
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
    ];

    const badges = achievementTypes.map(type => Achievement.getTemplate(type)).filter(b => b);

    res.json({
      success: true,
      data: badges
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ message: 'Error fetching badges', error: error.message });
  }
};

// Get achievement statistics for a class
export const getAchievementStats = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc || (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const achievements = await Achievement.find({ classId });

    // Count by type
    const byType = {};
    const achievementTypes = [
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
    ];

    achievementTypes.forEach(type => {
      byType[type] = achievements.filter(a => a.type === type).length;
    });

    // Total and averages
    const progressRecords = await StudentProgress.find({ classId });
    const totalStudents = progressRecords.length;
    const studentsWithAchievements = [...new Set(achievements.map(a => a.studentId.toString()))].length;

    const stats = {
      totalAchievementsEarned: achievements.length,
      totalStudents,
      studentsWithAchievements,
      participationRate: totalStudents > 0 ? Math.round((studentsWithAchievements / totalStudents) * 100) : 0,
      averagePerStudent: totalStudents > 0 ? Math.round((achievements.length / totalStudents) * 100) / 100 : 0,
      byType,
      mostEarned: Object.entries(byType).sort((a, b) => b[1] - a[1])[0],
      leastEarned: Object.entries(byType).sort((a, b) => a[1] - b[1])[0]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching achievement stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// Get student profile with achievements
export const getStudentAchievementProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get student info
    const student = await User.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get achievements
    const achievements = await Achievement.find({ studentId })
      .populate('classId', 'title')
      .lean();

    // Get progress summary
    const progressRecords = await StudentProgress.find({ studentId })
      .select('completionPercentage overallScore engagementScore status')
      .lean();

    // Calculate totals
    const totalCourses = progressRecords.length;
    const completedCourses = progressRecords.filter(p => p.status === 'completed').length;
    const averageScore = progressRecords.length > 0
      ? Math.round((progressRecords.reduce((sum, p) => sum + (p.overallScore || 0), 0) / progressRecords.length) * 100) / 100
      : 0;

    // Group achievements
    const achievementsByType = {};
    achievements.forEach(ach => {
      if (!achievementsByType[ach.type]) {
        achievementsByType[ach.type] = [];
      }
      achievementsByType[ach.type].push({
        name: ach.name,
        class: ach.classId?.title,
        awardedAt: ach.awardedAt
      });
    });

    res.json({
      success: true,
      data: {
        student: {
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          avatar: student.profilePicture
        },
        achievements: {
          total: achievements.length,
          byType: achievementsByType
        },
        progress: {
          totalCourses,
          completedCourses,
          completionRate: totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0,
          averageScore
        },
        displayProfile: {
          achievements: achievements.slice(0, 5), // Show top 5
          completedCourses,
          learningStreak: Math.round(Math.random() * 30) // Placeholder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
};

// Export achievements for compliance
export const exportAchievements = async (req, res) => {
  try {
    const { classId } = req.params;
    const { format = 'json' } = req.query; // json, csv

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc || (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const achievements = await Achievement.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .populate('classId', 'title');

    if (format === 'csv') {
      const headers = ['Student Name', 'Email', 'Achievement', 'Type', 'Awarded Date'];
      const rows = achievements.map(a => [
        `${a.studentId.firstName} ${a.studentId.lastName}`,
        a.studentId.email,
        a.name,
        a.type,
        a.awardedAt.toLocaleDateString()
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="achievements-export.csv"');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: achievements,
        exportDate: new Date()
      });
    }
  } catch (error) {
    console.error('Error exporting achievements:', error);
    res.status(500).json({ message: 'Error exporting achievements', error: error.message });
  }
};
