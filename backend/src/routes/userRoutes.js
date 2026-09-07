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
    const { paymentConfirmations, sessionReminders, subscriptionExpiry, classAnnouncements, marketingEmails } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        'emailPreferences.paymentConfirmations': paymentConfirmations,
        'emailPreferences.sessionReminders': sessionReminders,
        'emailPreferences.subscriptionExpiry': subscriptionExpiry,
        'emailPreferences.classAnnouncements': classAnnouncements,
        'emailPreferences.marketingEmails': marketingEmails,
      },
      { new: true, select: 'emailPreferences' }
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

// Verify email
router.post('/verify-email', authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    router.post('/verify-email-code', authenticateToken, async (req, res) => {
      try {
        const { code } = req.body;
        const user = await User.findOne({
          _id: req.user.id,
          emailVerificationToken: String(code || ''),
          emailVerificationExpires: { $gt: Date.now() },
        });
        if (!user) {
          const expiredUser = await User.findOne({ _id: req.user.id, emailVerificationToken: String(code || '') }).select('emailVerificationExpires');
          return res.status(expiredUser ? 410 : 400).json({ message: expiredUser ? 'Verification code expired' : 'Invalid verification code' });
        }
        user.emailPreferences.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        res.json({ message: 'Email verified successfully', isHost: user.isHost });
      } catch (error) {
        console.error('Error verifying email code:', error);
        res.status(500).json({ message: 'Unable to verify email.' });
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.emailPreferences.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send email verification
router.post('/send-verification', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailPreferences.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate verification token
    const verificationToken = String(Math.floor(100000 + Math.random() * 900000));
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send verification email
    const { sendEmail } = await import('../utils/email.js');
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email - EduTalk',
      template: 'email-verification',
      data: {
        firstName: user.firstName,
        verificationLink: `${process.env.FRONTEND_URL}/verify-email`,
        verificationCode: verificationToken,
      },
    });

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Error sending verification email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;