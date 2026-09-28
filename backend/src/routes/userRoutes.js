import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user email preferences
router.get('/email-preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('emailPreferences');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.emailPreferences);
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user email preferences
router.put('/email-preferences', authenticateToken, async (req, res) => {
  try {
    const allowedPreferences = ['sessionReminders', 'recordingReady', 'newEnrollment', 'productUpdates'];
    const updates = Object.fromEntries(allowedPreferences
      .filter((key) => typeof req.body?.[key] === 'boolean')
      .map((key) => [`emailPreferences.${key}`, req.body[key]]));
    updates['emailPreferences.payoutEmails'] = true;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, select: 'emailPreferences' },
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.emailPreferences);
  } catch (error) {
    console.error('Error updating email preferences:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;