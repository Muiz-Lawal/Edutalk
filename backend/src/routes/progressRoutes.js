import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getStudentProgress,
  getClassProgress,
  updateProgress,
  getProgressAnalytics,
  getAtRiskStudents,
  predictCompletion,
  markAttendance,
  getLeaderboard,
  getStudentAllProgress,
  exportProgressReport
} from '../controllers/progressController.js';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateToken);

// Specific routes MUST come before generic routes
router.get('/my-progress', (req, res, next) => {
  req.params.studentId = req.user.id;
  next();
}, getStudentAllProgress);

router.get('/student/:studentId', getStudentAllProgress);

router.get('/class/:classId/analytics', getProgressAnalytics);

router.get('/class/:classId/at-risk', getAtRiskStudents);

router.get('/class/:classId/leaderboard', getLeaderboard);

router.get('/class/:classId/export', exportProgressReport);

router.get('/class/:classId', getClassProgress);

router.get('/enrollment/:enrollmentId/prediction', predictCompletion);

router.post('/enrollment/:enrollmentId/attendance', markAttendance);

// Generic routes
router.put('/enrollment/:enrollmentId', updateProgress);

router.get('/enrollment/:enrollmentId', getStudentProgress);

router.get('/', getStudentAllProgress);

export default router;
