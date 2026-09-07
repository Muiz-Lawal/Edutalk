import User from '../models/User.js';
import AdminSession from '../models/AdminSession.js';
import { generateToken, hashPassword, comparePassword } from '../utils/auth.js';
import { logActivity } from '../utils/activityLogger.js';
import { validatePassword, isPasswordExpired } from '../utils/passwordValidator.js';
import { 
  sendFailedLoginEmail, 
  sendPasswordChangedEmail,
  sendSuspiciousActivityEmail,
} from '../utils/emailNotifications.js';
import { createAdminSession, checkSuspiciousLogin } from '../utils/sessionManager.js';

const getAgeFromDateOfBirth = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age;
};

const validateHostRegistration = (isHost, dateOfBirth) => {
  if (!isHost) {
    return null;
  }

  if (!dateOfBirth) {
    return 'Date of birth is required to register as a host.';
  }

  const age = getAgeFromDateOfBirth(dateOfBirth);
  if (age === null || age < 18) {
    return 'Only users aged 18 or older can register as a host.';
  }

  return null;
};

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, isHost, dateOfBirth, isAdmin, adminRole } = req.body;

    if (isAdmin || adminRole) {
      return res.status(400).json({ message: 'Admin accounts must use the separate admin registration flow.' });
    }

    let existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isAdmin) {
        return res.status(400).json({ message: 'This email is already linked to an admin account. Use the admin login flow.' });
      }
      return res.status(400).json({ message: 'User already exists' });
    }

    const hostValidationError = validateHostRegistration(Boolean(isHost), dateOfBirth);
    if (hostValidationError) {
      return res.status(400).json({ message: hostValidationError });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth || undefined,
      isStudent: true,
      isHost: Boolean(isHost),
      isAdmin: false,
      isSuperAdmin: false,
      adminRole: null,
      emailVerificationToken: String(Math.floor(100000 + Math.random() * 900000)),
      emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    });

    await user.save();
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email verification code:', user.emailVerificationToken);
    }
    try {
      const { sendEmail } = await import('../utils/email.js');
      await sendEmail({
        to: user.email,
        subject: 'Your EduTalk verification code',
        template: 'email-verification',
        data: { firstName: user.firstName, verificationCode: user.emailVerificationToken },
      });
    } catch (emailError) {
      console.error('Unable to send verification email:', emailError);
    }

    const token = generateToken(user._id, user.email);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isAdmin) {
      return res.status(403).json({ message: 'Admin accounts must use the admin login flow.' });
    }
    
    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const token = generateToken(user._id, user.email);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
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
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import { sanitizeUserForRequester } from '../utils/sanitize.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Preserve role fields when a user loads their own profile so admin sessions
    // remain admin sessions after the initial login response.
    const requesterRole = user._id.toString() === req.user.userId.toString()
      ? user.adminRole
      : req.user?.adminRole || null;
    const sanitized = sanitizeUserForRequester(user, requesterRole);

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, timezone, preferredLanguage, preferredCurrency, interests, profileImage, theme } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName, bio, timezone, preferredLanguage, preferredCurrency, interests, profileImage, theme },
      { new: true }
    ).select('-password');
    
    const requesterRole = req.user?.adminRole || null;
    const sanitized = sanitizeUserForRequester(user, requesterRole);

    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHostOnboarding = async (req, res) => {
  try {
    const allowed = ['hostDisplayName', 'hostHeadline', 'hostBio', 'hostExperience', 'hostLanguages', 'hostCategories', 'hostCredentials', 'payoutCountry', 'payoutMethod', 'payoutDeferred', 'hostCommissionAccepted'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findOneAndUpdate(
      { _id: req.user.userId, isHost: true },
      { $set: updates },
      { new: true, runValidators: true },
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'Host profile not found' });
    res.json(sanitizeUserForRequester(user, req.user?.adminRole || null));
  } catch (error) {
    console.error('Unable to update host onboarding:', error);
    res.status(500).json({ message: 'Unable to save your host profile.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.errors.join('. ') });
    }
    const user = await User.findById(req.user.userId);
    if (!user || !(await comparePassword(currentPassword, user.password))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = await hashPassword(newPassword);
    user.passwordChangedAt = new Date();
    user.passwordExpiresAt = undefined;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const upgradeToHost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isAdmin) {
      return res.status(403).json({ message: 'Admin accounts cannot be upgraded to host accounts.' });
    }

    const { hostBio, stripeConnectId, dateOfBirth } = req.body;
    const effectiveDateOfBirth = dateOfBirth || user.dateOfBirth;
    const hostValidationError = validateHostRegistration(true, effectiveDateOfBirth);

    if (hostValidationError) {
      return res.status(400).json({ message: hostValidationError });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isHost: true,
        dateOfBirth: effectiveDateOfBirth,
        hostBio,
        stripeConnectId,
      },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Upgraded to host',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== ADMIN LOGIN WITH SECURITY ====================

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log('[adminLogin] Request received:', { email, ipAddress });

    // Find admin user
    const user = await User.findOne({ email, isAdmin: true });
    if (!user) {
      console.log('[adminLogin] User not found or not admin:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('[adminLogin] User found, checking password...');

    // Check if account is locked
    if (user.isLockedUntil && new Date(user.isLockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.isLockedUntil) - new Date()) / (1000 * 60)
      );
      return res.status(423).json({
        error: `Account locked due to multiple failed login attempts. Try again in ${minutesRemaining} minutes.`,
      });
    }

    // Check if user is suspended
    if (user.suspendedAt) {
      await logActivity(
        user._id,
        email,
        user.adminRole,
        'failed_login',
        'User',
        user._id,
        email,
        'Login attempt on suspended account',
        'high',
        ipAddress,
        userAgent
      );

      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    // Verify password
    const { comparePassword } = await import('../utils/auth.js');
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      // Handle failed login attempt
      user.failedLoginCount = (user.failedLoginCount || 0) + 1;
      user.lastFailedLoginAttempts = user.lastFailedLoginAttempts || [];
      user.lastFailedLoginAttempts.push({
        timestamp: new Date(),
        ipAddress,
      });

      // Keep only last 10 attempts
      if (user.lastFailedLoginAttempts.length > 10) {
        user.lastFailedLoginAttempts = user.lastFailedLoginAttempts.slice(-10);
      }

      // Lock account after 5 failed attempts
      if (user.failedLoginCount >= 5) {
        user.isLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();

        // Send alert email
        await sendFailedLoginEmail(user.email, user.failedLoginCount, ipAddress);

        await logActivity(
          user._id,
          email,
          user.adminRole,
          'failed_login',
          'User',
          user._id,
          email,
          `Account locked after ${user.failedLoginCount} failed attempts`,
          'critical',
          ipAddress,
          userAgent
        );

        return res.status(423).json({
          error: 'Account locked due to multiple failed login attempts. Please try again in 30 minutes.',
        });
      }

      await user.save();

      await logActivity(
        user._id,
        email,
        user.adminRole,
        'failed_login',
        'User',
        user._id,
        email,
        `Failed login attempt (${user.failedLoginCount}/${5})`,
        'medium',
        ipAddress,
        userAgent
      );

      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset failed login count on successful password verification
    user.failedLoginCount = 0;
    user.lastFailedLoginAttempts = [];
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    user.lastActivityAt = new Date();

    // Check if password is expired
    if (isPasswordExpired(user.passwordChangedAt)) {
      // Allow login but require password change
      const token = (await import('../utils/auth.js')).generateToken(user._id, user.email);

      return res.json({
        message: 'Password change required',
        requiresPasswordChange: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          adminRole: user.adminRole,
        },
      });
    }

    // Check for suspicious login
    const suspiciousCheck = await checkSuspiciousLogin(user._id, ipAddress);
    if (suspiciousCheck.isSuspicious) {
      await sendSuspiciousActivityEmail(user.email, {
        action: 'Login attempt from new location',
        location: 'N/A',
        timestamp: new Date().toLocaleString(),
        ipAddress,
      });
    }

    // Generate JWT token
    const { generateToken } = await import('../utils/auth.js');
    const token = generateToken(user._id, user.email);

    console.log('[adminLogin] Generated token:', {
      userId: user._id,
      email: user.email,
      tokenLength: token.length,
      tokenStart: token.substring(0, 100),
    });

    // Invalidate old sessions for this user
    await AdminSession.updateMany(
      { adminId: user._id, isActive: true },
      { isActive: false, logoutTime: new Date() }
    );

    // Create new admin session
    const session = await createAdminSession(
      user._id,
      user.email,
      user.adminRole,
      token,
      ipAddress,
      userAgent
    );

    console.log('[adminLogin] Created session:', {
      sessionId: session._id,
      adminId: session.adminId,
      tokenLength: session.token?.length,
      tokenStart: session.token?.substring(0, 100),
    });

    await user.save();

    // Log successful login
    await logActivity(
      user._id,
      email,
      user.adminRole,
      'login',
      'User',
      user._id,
      email,
      `Admin login`,
      'low',
      ipAddress,
      userAgent
    );

    // Check if 2FA is enabled
    if (user.twoFAEnabled) {
      return res.json({
        message: '2FA verification required',
        requires2FA: true,
        token,
        sessionId: session._id,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isAdmin: user.isAdmin,
          isSuperAdmin: user.isSuperAdmin,
          adminRole: user.adminRole,
        },
      });
    }

    res.json({
      message: 'Login successful',
      token,
      sessionId: session._id,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        adminRole: user.adminRole,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin logout
export const adminLogout = async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      await AdminSession.findByIdAndUpdate(
        sessionId,
        {
          isActive: false,
          logoutTime: new Date(),
        }
      );
    }

    await logActivity(
      req.user._id,
      req.user.email,
      req.user.adminRole,
      'logout',
      'User',
      req.user._id,
      req.user.email,
      'Admin logout',
      'low',
      req.ip,
      req.headers['user-agent']
    );

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
