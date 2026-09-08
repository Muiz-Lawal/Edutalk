import User from '../models/User.js';
import { generateToken, hashPassword } from '../utils/auth.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { CODE_PURPOSES, consumeVerificationCode, issueVerificationCode } from '../utils/verificationCodes.js';
import { passwordResetEmail, sendMail, verificationEmail, welcomeEmail } from '../utils/mailer.js';

const publicUser = (user) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  isStudent: user.isStudent,
  isHost: user.isHost,
  isAdmin: user.isAdmin,
  isSuperAdmin: user.isSuperAdmin,
  adminRole: user.adminRole,
  planTier: user.planTier,
});

const sendVerification = async (user) => {
  const issued = await issueVerificationCode({
    email: user.email,
    purpose: CODE_PURPOSES.EMAIL_VERIFICATION,
  });
  const template = verificationEmail({ firstName: user.firstName, code: issued.code, email: user.email });
  await sendMail({ to: user.email, ...template, code: issued.code });
};

export const verifyEmail = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const result = await consumeVerificationCode({
      email,
      code: req.body.code,
      purpose: CODE_PURPOSES.EMAIL_VERIFICATION,
    });
    if (result.status !== 'valid') return res.status(400).json({ error: result.status });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'invalid_code' });
    user.emailPreferences.emailVerified = true;
    await user.save();

    const welcomeClaim = await User.findOneAndUpdate(
      { _id: user._id, welcomeEmailSentAt: null },
      { $set: { welcomeEmailSentAt: new Date() } },
      { new: true },
    );
    if (welcomeClaim) {
      const template = welcomeEmail({ firstName: user.firstName, isHost: user.isHost });
      await sendMail({ to: user.email, ...template });
    }

    return res.json({ ok: true, token: generateToken(user._id, user.email), user: publicUser(user) });
  } catch (error) {
    if (error.code === 'RATE_LIMITED') return res.status(429).json({ error: 'rate_limited' });
    console.error('Email verification failed:', error);
    return res.status(500).json({ error: 'verification_unavailable' });
  }
};

export const resendCode = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  try {
    const user = await User.findOne({ email });
    if (user && !user.emailPreferences.emailVerified) await sendVerification(user);
  } catch (error) {
    if (error.code !== 'RATE_LIMITED') console.error('Verification resend failed:', error);
  }
  return res.json({ ok: true });
};

export const requestPasswordReset = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  try {
    const user = await User.findOne({ email });
    if (user) {
      const issued = await issueVerificationCode({ email, purpose: CODE_PURPOSES.PASSWORD_RESET });
      const template = passwordResetEmail({ firstName: user.firstName, code: issued.code, email });
      await sendMail({ to: email, ...template, code: issued.code });
    }
  } catch (error) {
    if (error.code !== 'RATE_LIMITED') console.error('Password reset request failed:', error);
  }
  return res.json({ ok: true });
};

export const resetPassword = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const result = await consumeVerificationCode({ email, code: req.body.code, purpose: CODE_PURPOSES.PASSWORD_RESET });
  if (result.status !== 'valid') return res.status(400).json({ error: result.status });
  const validation = validatePassword(req.body.password);
  if (!validation.isValid) return res.status(400).json({ error: 'invalid_password' });
  await User.findOneAndUpdate(
    { email },
    { $set: { password: await hashPassword(req.body.password), passwordChangedAt: new Date() }, $inc: { tokenVersion: 1 } },
  );
  return res.json({ ok: true });
};
