import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  grantAchievement,
  getAchievements,
  getLeaderboard,
  checkMilestones,
  getAllBadges,
  getAchievementStats,
  getStudentAchievementProfile,
  exportAchievements
} from '../controllers/achievementController.js';

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateToken);

// Specific routes MUST come before generic routes
router.get('/badges/all', getAllBadges);

router.get('/my-achievements', (req, res, next) => {
  req.params.studentId = req.user.id;
  next();
}, getAchievements);

router.get('/student/:studentId', getAchievements);

router.get('/profile/:studentId', getStudentAchievementProfile);

router.get('/leaderboard/:classId', getLeaderboard);

router.post('/check/:enrollmentId', checkMilestones);

router.get('/stats/:classId', getAchievementStats);

router.get('/export/:classId', exportAchievements);

// Generic routes
router.post('/', grantAchievement);

router.get('/', (req, res, next) => {
  req.params.studentId = req.user.id;
  next();
}, getAchievements);

router.get('/:studentId', getAchievements);

export default router;
