import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import AdminSettings from '../models/AdminSettings.js';
import Class from '../models/Class.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import { hashPassword } from '../utils/auth.js';
import { createNotification } from './notificationController.js';
import EmailJob from '../models/EmailJob.js';

// Log admin action
const logAdminAction = async (adminId, adminEmail, action, targetType, targetId, targetEmail, details = {}) => {
  try {
    await AdminLog.create({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      targetEmail,
      details,
      status: 'success',
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
};

// Get dashboard overview stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalHosts = await User.countDocuments({ isHost: true });
    const totalClasses = await Class.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // User growth (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userGrowth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    // Revenue last 30 days
    const revenueLastMonth = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      totalUsers,
      totalHosts,
      totalClasses,
      totalRevenue: totalRevenue[0]?.total || 0,
      userGrowth,
      revenueLastMonth: revenueLastMonth[0]?.total || 0,
      suspendedUsers: await User.countDocuments({ suspendedAt: { $exists: true, $ne: null } }),
      bannedUsers: await User.countDocuments({ bannedAt: { $exists: true, $ne: null } }),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    if (role === 'host') query.isHost = true;
    if (role === 'student') query.isStudent = true;

    if (status === 'suspended') {
      query.suspendedAt = { $exists: true, $ne: null };
    } else if (status === 'banned') {
      query.bannedAt = { $exists: true, $ne: null };
    } else if (status === 'active') {
      query.suspendedAt = { $exists: false };
      query.bannedAt = { $exists: false };
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user details
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password').populate('createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's classes if host
    let classes = [];
    if (user.isHost) {
      classes = await Class.find({ hostId: userId }).select('title students totalStudents');
    }

    // Get user's activity
    const activityLog = await AdminLog.find({ targetId: userId }).limit(20).sort({ createdAt: -1 });

    res.json({
      user,
      classes,
      activityLog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Suspend user
export const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        suspendedAt: new Date(),
        suspendReason: reason,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(
      req.user._id,
      req.user.email,
      'user_suspended',
      'User',
      userId,
      user.email,
      { reason }
    );

    res.json({ message: 'User suspended', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unsuspend user
export const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $unset: { suspendedAt: 1, suspendReason: 1 },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logAdminAction(
      req.user._id,
      req.user.email,
      'user_unsuspended',
      'User',
      userId,
      user.email
    );

    res.json({ message: 'User unsuspended', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting SuperAdmin (unless deleting user is also SuperAdmin)
    if (user.isSuperAdmin && !req.user.isSuperAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. Cannot delete SuperAdmin accounts. Only SuperAdmin can delete SuperAdmins.' 
      });
    }

    // Prevent deleting the last SuperAdmin
    if (user.isSuperAdmin) {
      const superadminCount = await User.countDocuments({ isSuperAdmin: true });
      if (superadminCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last SuperAdmin. Create another SuperAdmin first.' 
        });
      }
    }

    await User.findByIdAndDelete(userId);

    await logAdminAction(
      req.user._id,
      req.user.email,
      'user_deleted',
      'User',
      userId,
      user.email,
      { reason, isSuperAdmin: user.isSuperAdmin, adminRole: user.adminRole }
    );

    res.json({ message: 'User deleted', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get admin logs
export const getAdminLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, adminId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (action) query.action = action;
    if (adminId) query.adminId = adminId;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AdminLog.find(query)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await AdminLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get admin settings
export const getAdminSettings = async (req, res) => {
  try {
    const settings = await AdminSettings.find();
    
    const settingsMap = {};
    settings.forEach(setting => {
      settingsMap[setting.key] = setting.value;
    });

    res.json(settingsMap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update admin setting
export const updateAdminSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const setting = await AdminSettings.findOneAndUpdate(
      { key },
      {
        key,
        value,
        updatedBy: req.user._id,
        updatedByEmail: req.user.email,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await logAdminAction(
      req.user._id,
      req.user.email,
      'settings_updated',
      'Settings',
      null,
      null,
      { setting: key, newValue: value }
    );

    res.json({ message: 'Setting updated', setting });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADMIN MANAGEMENT FUNCTIONS (SuperAdmin Only)

// Get all admin users
export const getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;

    let query = { isAdmin: true };

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
      ];
    }

    const admins = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      admins,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new admin user
export const createAdminUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, adminRole } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !adminRole) {
      return res.status(400).json({ 
        error: 'Email, password, name, and role are required' 
      });
    }

    // Validate role
    const validRoles = ['moderator', 'support', 'admin', 'superadmin'];
    if (!validRoles.includes(adminRole)) {
      return res.status(400).json({ 
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine admin flags based on role
    const isSuperAdmin = adminRole === 'superadmin';
    const isAdmin = true;

    // Create new admin user
    const newAdmin = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isAdmin,
      isSuperAdmin,
      adminRole,
      isStudent: false,
      isHost: false,
      emailPreferences: {
        paymentConfirmations: true,
        sessionReminders: true,
        subscriptionExpiry: true,
        classAnnouncements: true,
        marketingEmails: false,
        emailVerified: true,
      },
    });

    await newAdmin.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'admin_created',
      'Admin',
      newAdmin._id,
      email,
      { role: adminRole }
    );

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: {
        id: newAdmin._id,
        email: newAdmin.email,
        firstName: newAdmin.firstName,
        lastName: newAdmin.lastName,
        adminRole: newAdmin.adminRole,
        isAdmin: newAdmin.isAdmin,
        isSuperAdmin: newAdmin.isSuperAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update admin user role and privileges
export const updateAdminUser = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { firstName, lastName, adminRole } = req.body;

    // Validate role if provided
    if (adminRole) {
      const validRoles = ['moderator', 'support', 'admin', 'superadmin'];
      if (!validRoles.includes(adminRole)) {
        return res.status(400).json({ 
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
        });
      }
    }

    const admin = await User.findById(adminId);
    if (!admin || !admin.isAdmin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Prevent deleting the last superadmin (if updating from superadmin)
    if (admin.isSuperAdmin && adminRole && adminRole !== 'superadmin') {
      const superadminCount = await User.countDocuments({ isSuperAdmin: true });
      if (superadminCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot demote the last SuperAdmin. Create another SuperAdmin first.' 
        });
      }
    }

    // Update fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    
    if (adminRole) {
      admin.adminRole = adminRole;
      admin.isSuperAdmin = adminRole === 'superadmin';
    }

    await admin.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'admin_updated',
      'Admin',
      adminId,
      admin.email,
      { role: adminRole, firstName, lastName }
    );

    res.json({
      message: 'Admin user updated successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        adminRole: admin.adminRole,
        isAdmin: admin.isAdmin,
        isSuperAdmin: admin.isSuperAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete admin user
export const deleteAdminUser = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { reason } = req.body;

    const admin = await User.findById(adminId);
    if (!admin || !admin.isAdmin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Prevent deletion of SuperAdmin accounts (security best practice)
    if (admin.isSuperAdmin) {
      return res.status(403).json({ 
        error: 'SuperAdmin accounts cannot be deleted. Demote the account to a lower role instead using the update endpoint.',
        hint: 'Use PUT /api/admin/admins/:adminId to demote a SuperAdmin to another role.'
      });
    }

    const deletedEmail = admin.email;
    await User.findByIdAndDelete(adminId);

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'admin_deleted',
      'Admin',
      adminId,
      deletedEmail,
      { reason, role: admin.adminRole, isSuperAdmin: admin.isSuperAdmin }
    );

    res.json({ 
      message: 'Admin user deleted successfully',
      deletedEmail,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Change admin password
export const changeAdminPassword = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters' 
      });
    }

    const admin = await User.findById(adminId);
    if (!admin || !admin.isAdmin) {
      return res.status(404).json({ error: 'Admin user not found' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    admin.password = hashedPassword;
    await admin.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'admin_password_changed',
      'Admin',
      adminId,
      admin.email,
      {}
    );

    res.json({ 
      message: 'Admin password changed successfully',
      email: admin.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ANALYTICS ENDPOINTS

// Get user growth trend (last 30 days, daily data)
export const getUserGrowthTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const userTrend = await User.aggregate([
      {
        $match: { createdAt: { $gte: thirtyDaysAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dateMap = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = 0;
    }

    userTrend.forEach(item => {
      dateMap[item._id] = item.count;
    });

    const data = Object.entries(dateMap).map(([date, count]) => ({
      date,
      count,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get revenue trend (last 30 days, daily data)
export const getRevenueTrend = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const revenueTrend = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dateMap = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap[dateStr] = 0;
    }

    revenueTrend.forEach(item => {
      dateMap[item._id] = item.revenue;
    });

    const data = Object.entries(dateMap).map(([date, revenue]) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top hosts by revenue
export const getTopHosts = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topHosts = await User.aggregate([
      { $match: { isHost: true } },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: 'hostId',
          as: 'classes'
        }
      },
      {
        $lookup: {
          from: 'payments',
          let: { hostId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$hostId', '$$hostId'] },
                status: 'completed'
              }
            }
          ],
          as: 'payments'
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          classCount: { $size: '$classes' },
          studentCount: { $sum: '$classes.totalStudents' },
          revenue: { $sum: '$payments.amount' },
          rating: { $avg: '$classes.rating' }
        }
      },
      {
        $match: { classCount: { $gt: 0 } }
      },
      { $sort: { revenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(topHosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top classes by enrollment
export const getTopClasses = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topClasses = await Class.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'hostId',
          foreignField: '_id',
          as: 'hostInfo'
        }
      },
      {
        $unwind: {
          path: '$hostInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          category: 1,
          totalStudents: 1,
          price: 1,
          rating: 1,
          hostName: { $concat: ['$hostInfo.firstName', ' ', '$hostInfo.lastName'] },
          hostEmail: '$hostInfo.email'
        }
      },
      { $sort: { totalStudents: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(topClasses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get engagement metrics
export const getEngagementMetrics = async (req, res) => {
  try {
    const activeUsers = await User.countDocuments();
    const activeClasses = await Class.countDocuments();

    const classStats = await Class.aggregate([
      {
        $group: {
          _id: null,
          avgStudents: { $avg: '$totalStudents' },
          totalEnrollments: { $sum: '$totalStudents' }
        }
      }
    ]);

    res.json({
      activeUsers,
      activeClasses,
      avgStudentsPerClass: parseFloat((classStats[0]?.avgStudents || 0).toFixed(2)),
      totalEnrollments: classStats[0]?.totalEnrollments || 0,
      engagementRate: activeUsers > 0 ? parseFloat(((activeClasses / activeUsers) * 100).toFixed(2)) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get platform statistics
export const getPlatformStats = async (req, res) => {
  try {
    const classesByCategory = await Class.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: null,
          students: { $sum: { $cond: ['$isStudent', 1, 0] } },
          hosts: { $sum: { $cond: ['$isHost', 1, 0] } },
          admins: { $sum: { $cond: ['$isAdmin', 1, 0] } }
        }
      }
    ]);

    res.json({
      classesByCategory,
      usersByRole: usersByRole[0] || { students: 0, hosts: 0, admins: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user activity (logins, classes, payments, etc.)
export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent logins (last 10)
    const logins = await AdminLog.find({
      targetId: userId,
      action: { $in: ['user_login', 'user_created'] }
    })
      .select('action createdAt')
      .limit(10)
      .sort({ createdAt: -1 });

    // Get class enrollments
    const enrollments = await Subscription.find({ studentId: userId })
      .populate('classId', 'title hostId createdAt')
      .select('enrolledAt')
      .limit(10)
      .sort({ enrolledAt: -1 });

    // Get hosted classes (if host)
    let hostedClasses = [];
    if (user.isHost) {
      hostedClasses = await Class.find({ hostId: userId })
        .select('title createdAt totalStudents rating')
        .limit(10)
        .sort({ createdAt: -1 });
    }

    // Get payment history
    const payments = await Payment.find({
      $or: [
        { studentId: userId },
        { hostId: userId }
      ]
    })
      .select('amount status type createdAt classId')
      .limit(10)
      .sort({ createdAt: -1 });

    // Get admin actions on this user
    const adminActions = await AdminLog.find({
      targetId: userId
    })
      .select('action adminEmail details createdAt')
      .limit(20)
      .sort({ createdAt: -1 });

    res.json({
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isHost: user.isHost,
        isStudent: user.isStudent,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        suspendedAt: user.suspendedAt,
        bannedAt: user.bannedAt
      },
      activity: {
        logins,
        enrollments: enrollments.map(e => ({
          classTitle: e.classId?.title,
          enrolledAt: e.enrolledAt
        })),
        hostedClasses,
        payments,
        adminActions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send admin message to user
export const sendAdminMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { subject, content, type = 'notification', disableReply = false } = req.body;

    // Validate inputs
    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store message in AdminLog as notification
    const messageLog = await AdminLog.create({
      adminId: req.user._id,
      adminEmail: req.user.email,
      action: 'admin_message_sent',
      targetType: 'User',
      targetId: userId,
      targetEmail: user.email,
      details: {
        subject,
        content,
        type,
        disableReply,
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      },
      status: 'success'
    });

    // TODO: Send actual email notification if enabled
    // await sendEmailNotification(user.email, subject, content);

    res.json({
      message: 'Message sent successfully',
      messageId: messageLog.details.messageId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages sent to a user
export const getAdminMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const messages = await AdminLog.find({
      targetId: userId,
      action: 'admin_message_sent'
    })
      .select('adminEmail details createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AdminLog.countDocuments({
      targetId: userId,
      action: 'admin_message_sent'
    });

    res.json({
      messages: messages.map(m => ({
        id: m.details.messageId,
        adminEmail: m.adminEmail,
        subject: m.details.subject,
        content: m.details.content,
        type: m.details.type,
        createdAt: m.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// PHASE 5D: CONTENT MODERATION ENDPOINTS
// ============================================

// Get moderation queue (flagged content)
export const getModerationQueue = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', reason = 'all' } = req.query;
    const skip = (page - 1) * limit;

    // Build query for flagged classes
    let matchStage = { flaggedCount: { $gt: 0 } };
    
    if (status !== 'all') {
      matchStage.moderationStatus = status;
    }
    if (reason !== 'all') {
      matchStage['flags.reason'] = reason;
    }

    // Get flagged classes with aggregation
    const queue = await Class.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'hostId',
          foreignField: '_id',
          as: 'hostInfo'
        }
      },
      {
        $addFields: {
          hostName: { $arrayElemAt: ['$hostInfo.firstName', 0] },
          hostEmail: { $arrayElemAt: ['$hostInfo.email', 0] }
        }
      },
      { $sort: { lastFlaggedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          hostId: 1,
          hostName: 1,
          hostEmail: 1,
          flagCount: '$flaggedCount',
          flags: 1,
          moderationStatus: 1,
          firstFlaggedAt: 1,
          lastFlaggedAt: 1,
          totalStudents: 1,
          createdAt: 1
        }
      }
    ]);

    // Get totals for stats
    const totalFlagged = await Class.countDocuments({ flaggedCount: { $gt: 0 } });
    const pending = await Class.countDocuments({ 
      flaggedCount: { $gt: 0 },
      moderationStatus: { $in: [undefined, 'pending'] }
    });
    const approved = await Class.countDocuments({ 
      flaggedCount: { $gt: 0 },
      moderationStatus: 'approved'
    });
    const rejected = await Class.countDocuments({ 
      flaggedCount: { $gt: 0 },
      moderationStatus: 'rejected'
    });
    const removed = await Class.countDocuments({ 
      flaggedCount: { $gt: 0 },
      moderationStatus: 'removed'
    });
    const suspended = await Class.countDocuments({ 
      flaggedCount: { $gt: 0 },
      moderationStatus: 'suspended'
    });

    res.json({
      queue,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalFlagged,
        pages: Math.ceil(totalFlagged / limit)
      },
      stats: {
        totalFlagged,
        pending,
        approved,
        rejected,
        removed,
        suspended
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get details for a flagged content
export const getModerationDetails = async (req, res) => {
  try {
    const { contentId } = req.params;

    const classItem = await Class.findById(contentId)
      .populate('hostId', 'email firstName lastName isHost');

    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get previous violations by host
    const previousViolations = await AdminLog.find({
      targetId: classItem.hostId,
      action: { $in: ['class_removed', 'class_suspended', 'moderation_decision'] }
    })
      .select('action details createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      classDetails: {
        _id: classItem._id,
        title: classItem.title,
        description: classItem.description,
        hostId: classItem.hostId._id,
        hostName: `${classItem.hostId.firstName} ${classItem.hostId.lastName || ''}`,
        hostEmail: classItem.hostId.email,
        totalStudents: classItem.totalStudents || 0,
        createdAt: classItem.createdAt,
        
        flagInfo: {
          flagCount: classItem.flaggedCount || 0,
          flags: classItem.flags || [],
          firstFlaggedAt: classItem.firstFlaggedAt,
          lastFlaggedAt: classItem.lastFlaggedAt,
          moderationStatus: classItem.moderationStatus || 'pending'
        }
      },
      previousViolations: previousViolations.map(v => ({
        action: v.action,
        reason: v.details.reason,
        createdAt: v.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve flagged content
export const approveModerationItem = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { notes = '' } = req.body;

    const classItem = await Class.findById(contentId);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update class
    classItem.moderationStatus = 'approved';
    classItem.flaggedCount = 0;
    classItem.flags = [];
    await classItem.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'moderation_approved',
      'Class',
      contentId,
      classItem.hostId,
      { classTitle: classItem.title, reason: 'Content approved', notes }
    );

    res.json({ message: 'Content approved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject flagged content
export const rejectModerationItem = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { reason = '', notes = '' } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const classItem = await Class.findById(contentId);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update class
    classItem.moderationStatus = 'rejected';
    classItem.rejectionReason = reason;
    classItem.rejectedAt = new Date();
    await classItem.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'moderation_rejected',
      'Class',
      contentId,
      classItem.hostId,
      { classTitle: classItem.title, reason, notes }
    );

    // Create in-app notification and enqueue an email for the host
    try {
      await createNotification(classItem.hostId, 'moderation_rejected', {
        classId: classItem._id,
        classTitle: classItem.title,
        reason,
        notes,
        moderationBy: req.user.email,
      });
    } catch (notifErr) {
      console.warn('Failed to create moderation notification:', notifErr.message || notifErr);
    }

    res.json({ message: 'Content rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove class from platform
export const removeClass = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { reason = '', notes = '' } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Removal reason is required' });
    }

    const classItem = await Class.findById(contentId);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Soft delete
    classItem.isDeleted = true;
    classItem.deletedAt = new Date();
    classItem.moderationStatus = 'removed';
    classItem.removalReason = reason;
    await classItem.save();

    // Process refunds to all students enrolled
    const subscriptions = await Subscription.find({ classId: contentId });
    for (const sub of subscriptions) {
      // Mark for refund processing
      const payment = await Payment.findOne({ 
        classId: contentId,
        studentId: sub.userId
      }).sort({ createdAt: -1 });

      if (payment && payment.status === 'completed') {
        payment.status = 'refund_pending';
        payment.refundReason = `Class removed: ${reason}`;
        await payment.save();
      }
    }

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'class_removed',
      'Class',
      contentId,
      classItem.hostId,
      { classTitle: classItem.title, reason, refundsProcessed: subscriptions.length, notes }
    );

    res.json({ 
      message: 'Class removed successfully',
      refundsProcessed: subscriptions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Suspend class
export const suspendClass = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { reason = '', notes = '' } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Suspension reason is required' });
    }

    const classItem = await Class.findById(contentId);
    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Update class
    classItem.suspendedAt = new Date();
    classItem.moderationStatus = 'suspended';
    classItem.suspensionReason = reason;
    await classItem.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'class_suspended',
      'Class',
      contentId,
      classItem.hostId,
      { classTitle: classItem.title, reason, notes }
    );

    // TODO: Send email to host about suspension
    // await sendEmailToHost(classItem.hostId, 'Class Suspended', `Your class has been suspended: ${reason}`);

    res.json({ message: 'Class suspended successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get moderation history
export const getModerationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, action = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let matchStage = { 
      action: { 
        $in: ['moderation_approved', 'moderation_rejected', 'class_removed', 'class_suspended']
      }
    };

    if (action !== 'all') {
      matchStage.action = action;
    }

    const history = await AdminLog.find(matchStage)
      .select('adminEmail action targetId details createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await AdminLog.countDocuments(matchStage);

    res.json({
      history: history.map(h => ({
        id: h._id,
        adminEmail: h.adminEmail,
        action: h.action,
        contentId: h.targetId,
        details: h.details,
        createdAt: h.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get moderation statistics
export const getModerationStats = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = {
      totalFlagged: await Class.countDocuments({ flaggedCount: { $gt: 0 } }),
      approved: await Class.countDocuments({ moderationStatus: 'approved' }),
      rejected: await Class.countDocuments({ moderationStatus: 'rejected' }),
      removed: await Class.countDocuments({ moderationStatus: 'removed' }),
      suspended: await Class.countDocuments({ moderationStatus: 'suspended' }),
      pending: await Class.countDocuments({ moderationStatus: { $in: [undefined, 'pending'] } }),
      
      // Last 30 days stats
      actionsLast30Days: await AdminLog.countDocuments({
        action: { $in: ['moderation_approved', 'moderation_rejected', 'class_removed', 'class_suspended'] },
        createdAt: { $gte: thirtyDaysAgo }
      }),
      
      // Common rejection reasons
      topReasons: await Class.aggregate([
        { $match: { moderationStatus: 'rejected' } },
        { $group: { _id: '$rejectionReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// PHASE 5E: PAYMENT & PAYOUTS ENDPOINTS
// ============================================

// Get transactions list with filters
export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', startDate, endDate, minAmount, maxAmount, hostId, studentEmail } = req.query;
    const skip = (page - 1) * limit;

    let matchStage = {};

    // Status filter
    if (status !== 'all') {
      matchStage.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      matchStage.amount = {};
      if (minAmount) {
        matchStage.amount.$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        matchStage.amount.$lte = parseFloat(maxAmount);
      }
    }

    // Host filter
    if (hostId) {
      matchStage.hostId = hostId;
    }

    const transactions = await Payment.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'hostId',
          foreignField: '_id',
          as: 'hostInfo'
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      {
        $addFields: {
          studentEmail: { $arrayElemAt: ['$studentInfo.email', 0] },
          hostEmail: { $arrayElemAt: ['$hostInfo.email', 0] },
          className: { $arrayElemAt: ['$classInfo.title', 0] }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          amount: 1,
          status: 1,
          type: 1,
          className: 1,
          studentEmail: 1,
          hostEmail: 1,
          studentId: 1,
          hostId: 1,
          commissionAmount: 1,
          hostEarnings: 1,
          createdAt: 1
        }
      }
    ]);

    const total = await Payment.countDocuments(matchStage);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get transaction details
export const getTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const payment = await Payment.findById(transactionId)
      .populate('studentId', 'email firstName lastName')
      .populate('hostId', 'email firstName lastName')
      .populate('classId', 'title description');

    if (!payment) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Get related transactions for timeline
    const relatedTransactions = await Payment.find({
      classId: payment.classId,
      studentId: payment.studentId
    }).sort({ createdAt: -1 });

    res.json({
      transaction: {
        _id: payment._id,
        amount: payment.amount,
        status: payment.status,
        type: payment.type,
        
        // People
        student: {
          id: payment.studentId._id,
          email: payment.studentId.email,
          name: `${payment.studentId.firstName} ${payment.studentId.lastName || ''}`
        },
        host: {
          id: payment.hostId._id,
          email: payment.hostId.email,
          name: `${payment.hostId.firstName} ${payment.hostId.lastName || ''}`
        },
        
        // Class info
        class: {
          id: payment.classId._id,
          title: payment.classId.title,
          description: payment.classId.description
        },
        
        // Commission breakdown
        commission: {
          rate: payment.commissionRate || 0,
          amount: payment.commissionAmount || 0,
          platformFee: payment.platformFee || 0,
          stripeFee: payment.stripeFee || 0
        },
        hostEarnings: payment.hostEarnings || (payment.amount - (payment.platformFee || 0) - (payment.stripeFee || 0)),
        
        // Refund info
        refund: {
          status: payment.refundStatus || 'none',
          reason: payment.refundReason,
          initiatedAt: payment.refundInitiatedAt,
          processedAt: payment.refundProcessedAt
        },
        
        // Payout info
        payout: {
          status: payment.payoutStatus || 'pending',
          date: payment.payoutDate,
          id: payment.payoutId
        },
        
        // Stripe info
        stripePaymentId: payment.stripePaymentId,
        paymentMethod: payment.paymentMethod,
        
        // Timestamps
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      },
      transactionHistory: relatedTransactions.map(t => ({
        id: t._id,
        amount: t.amount,
        status: t.status,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get revenue by host
export const getRevenueByHost = async (req, res) => {
  try {
    const hostRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$hostId',
          totalRevenue: { $sum: '$hostEarnings' },
          transactionCount: { $sum: 1 },
          studentCount: { $addToSet: '$studentId' }
        }
      },
      {
        $addFields: {
          studentCount: { $size: '$studentCount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'hostInfo'
        }
      },
      {
        $addFields: {
          hostEmail: { $arrayElemAt: ['$hostInfo.email', 0] },
          hostName: { $concat: [
            { $arrayElemAt: ['$hostInfo.firstName', 0] },
            ' ',
            { $arrayElemAt: ['$hostInfo.lastName', 0] }
          ]}
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 20 },
      {
        $project: {
          _id: 1,
          hostEmail: 1,
          hostName: 1,
          totalRevenue: 1,
          transactionCount: 1,
          studentCount: 1
        }
      }
    ]);

    res.json({ topHosts: hostRevenue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get revenue trends
export const getRevenueTrends = async (req, res) => {
  try {
    const { period = 'daily' } = req.query; // daily, weekly, monthly

    let groupFormat;
    if (period === 'daily') {
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (period === 'weekly') {
      groupFormat = { $week: '$createdAt' };
    } else {
      groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }

    const trends = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: groupFormat,
          revenue: { $sum: '$hostEarnings' },
          platformCommission: { $sum: '$commissionAmount' },
          transactions: { $sum: 1 },
          uniqueStudents: { $addToSet: '$studentId' },
          uniqueHosts: { $addToSet: '$hostId' }
        }
      },
      {
        $addFields: {
          uniqueStudents: { $size: '$uniqueStudents' },
          uniqueHosts: { $size: '$uniqueHosts' }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 90 }
    ]);

    res.json({ trends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payment summary statistics
export const getPaymentSummary = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Total statistics
    const totalStats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$hostEarnings' },
          platformCommission: { $sum: '$commissionAmount' },
          totalTransactions: { $sum: 1 },
          stripeFees: { $sum: '$stripeFee' },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    // Last 30 days statistics
    const monthlyStats = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$hostEarnings' },
          platformCommission: { $sum: '$commissionAmount' },
          totalTransactions: { $sum: 1 },
          uniqueStudents: { $addToSet: '$studentId' },
          uniqueHosts: { $addToSet: '$hostId' }
        }
      },
      {
        $addFields: {
          uniqueStudents: { $size: '$uniqueStudents' },
          uniqueHosts: { $size: '$uniqueHosts' }
        }
      }
    ]);

    // Pending refunds
    const pendingRefunds = await Payment.countDocuments({ refundStatus: 'pending' });

    // Pending payouts
    const pendingPayouts = await Payment.countDocuments({ payoutStatus: 'pending' });

    res.json({
      allTime: totalStats[0] || {},
      lastThirtyDays: monthlyStats[0] || {},
      pendingRefunds,
      pendingPayouts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get commission settings
export const getCommissionSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne({ key: 'commission_rates' });

    if (!settings) {
      // Default settings
      settings = {
        key: 'commission_rates',
        value: {
          starter: 0.25,
          growth: 0.20,
          pro: 0.15,
          elite: 0.10
        }
      };
    }

    res.json({
      commissionRates: settings.value || settings,
      stripeFeePercentage: 0.029,
      stripeFixedFee: 0.30,
      minPayout: 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update commission settings
export const updateCommissionSettings = async (req, res) => {
  try {
    const { commissionRates, stripeFeePercentage, stripeFixedFee, minPayout } = req.body;

    let settings = await AdminSettings.findOne({ key: 'commission_rates' });

    if (!settings) {
      settings = new AdminSettings({
        key: 'commission_rates',
        value: commissionRates || {
          starter: 0.25,
          growth: 0.20,
          pro: 0.15,
          elite: 0.10
        }
      });
    } else {
      settings.value = commissionRates || settings.value;
    }

    await settings.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'commission_settings_updated',
      'Settings',
      settings._id,
      null,
      { commissionRates, stripeFeePercentage, stripeFixedFee, minPayout }
    );

    res.json({ message: 'Commission settings updated successfully', settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export transactions to CSV
export const exportTransactions = async (req, res) => {
  try {
    const { startDate, endDate, status = 'all' } = req.query;

    let matchStage = {};

    if (status !== 'all') {
      matchStage.status = status;
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    const transactions = await Payment.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'hostId',
          foreignField: '_id',
          as: 'hostInfo'
        }
      },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classInfo'
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Build CSV
    let csv = 'Transaction ID,Date,Student Email,Host Email,Class Name,Amount,Commission,Host Earnings,Stripe Fee,Status\n';

    transactions.forEach(t => {
      const studentEmail = t.studentInfo[0]?.email || 'N/A';
      const hostEmail = t.hostInfo[0]?.email || 'N/A';
      const className = t.classInfo[0]?.title || 'N/A';

      csv += `"${t._id}","${t.createdAt.toISOString()}","${studentEmail}","${hostEmail}","${className}",${t.amount},${t.commissionAmount || 0},${t.hostEarnings || 0},${t.stripeFee || 0},"${t.status}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// PHASE 5F: HOST MANAGEMENT METHODS
// ============================================

// Get all hosts with stats
export const getAllHosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
    const skip = (page - 1) * limit;

    let matchStage = { role: 'host' };
    
    if (status !== 'all') {
      matchStage.hostStatus = status;
    }

    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const hosts = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: 'hostId',
          as: 'classes'
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'hostId',
          as: 'subscriptions'
        }
      },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'hostId',
          as: 'payments'
        }
      },
      {
        $group: {
          _id: '$_id',
          hostId: { $first: '$_id' },
          hostName: { $first: '$name' },
          email: { $first: '$email' },
          status: { $first: '$hostStatus' },
          planTier: { $first: '$hostPlanTier' },
          classCount: { $size: '$classes' },
          studentCount: { $size: '$subscriptions' },
          totalRevenue: { $sum: { $sum: '$payments.amount' } },
          rating: { $first: '$rating' },
          createdAt: { $first: '$createdAt' },
          suspensionCount: { $first: '$suspensionCount' }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.countDocuments(matchStage);

    res.json({
      data: hosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending hosts
export const getPendingHosts = async (req, res) => {
  try {
    const pending = await User.aggregate([
      { $match: { role: 'host', hostStatus: 'pending' } },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: 'hostId',
          as: 'classes'
        }
      },
      { $sort: { createdAt: 1 } }
    ]);

    res.json({ data: pending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get host details
export const getHostDetails = async (req, res) => {
  try {
    const { hostId } = req.params;

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Host not found' });
    }

    const classes = await Class.countDocuments({ hostId });
    const students = await Subscription.countDocuments({ hostId });
    const revenue = await Payment.aggregate([
      { $match: { hostId: host._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      host,
      stats: {
        classCount: classes,
        studentCount: students,
        totalRevenue: revenue[0]?.total || 0,
        rating: host.rating || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get host performance metrics
export const getHostPerformance = async (req, res) => {
  try {
    const { hostId } = req.params;

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Host not found' });
    }

    // Revenue metrics
    const revenueByMonth = await Payment.aggregate([
      { $match: { hostId: host._id, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // Class metrics
    const classes = await Class.countDocuments({ hostId });
    const students = await Subscription.countDocuments({ hostId });
    const totalRevenue = await Payment.aggregate([
      { $match: { hostId: host._id, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Activity (last class)
    const lastClass = await Class.findOne({ hostId }).sort({ createdAt: -1 });

    res.json({
      hostId,
      hostName: host.name,
      planTier: host.hostPlanTier,
      rating: host.rating || 0,
      classCount: classes,
      studentCount: students,
      totalRevenue: totalRevenue[0]?.total || 0,
      revenueByMonth,
      lastActivity: lastClass?.createdAt || null,
      suspensionCount: host.suspensionCount || 0,
      status: host.hostStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get top performers
export const getTopPerformers = async (req, res) => {
  try {
    const topHosts = await User.aggregate([
      { $match: { role: 'host', hostStatus: 'approved' } },
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'hostId',
          as: 'payments'
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'hostId',
          as: 'subscriptions'
        }
      },
      {
        $group: {
          _id: '$_id',
          hostName: { $first: '$name' },
          email: { $first: '$email' },
          totalRevenue: { $sum: { $sum: '$payments.amount' } },
          studentCount: { $size: '$subscriptions' },
          rating: { $first: '$rating' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({ data: topHosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get at-risk hosts
export const getAtRiskHosts = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const atRiskHosts = await User.aggregate([
      { $match: { role: 'host', hostStatus: 'approved' } },
      {
        $lookup: {
          from: 'classes',
          localField: '_id',
          foreignField: 'hostId',
          as: 'classes'
        }
      },
      {
        $project: {
          _id: 1,
          hostName: '$name',
          email: '$email',
          rating: '$rating',
          suspensionCount: '$suspensionCount',
          lastActivityDate: {
            $max: '$classes.createdAt'
          },
          riskFactors: {
            $cond: [
              {
                $or: [
                  { $lt: ['$rating', 3.5] },
                  { $gt: ['$suspensionCount', 0] },
                  { $lt: [{ $max: '$classes.createdAt' }, thirtyDaysAgo] }
                ]
              },
              'at_risk',
              'healthy'
            ]
          }
        }
      },
      { $match: { riskFactors: 'at_risk' } }
    ]);

    res.json({ data: atRiskHosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve a host
export const approveHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { notes = '' } = req.body;

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Host not found' });
    }

    if (host.hostStatus !== 'pending') {
      return res.status(400).json({ error: 'Host is not pending approval' });
    }

    host.hostStatus = 'approved';
    host.hostApprovedDate = new Date();
    await host.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'host_approved',
      'Host',
      hostId,
      host.email,
      { notes }
    );

    res.json({ message: 'Host approved successfully', host });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject a host
export const rejectHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { reason = '', notes = '' } = req.body;

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Host not found' });
    }

    host.hostStatus = 'rejected';
    host.rejectionReason = reason;
    host.rejectionNotes = notes;
    await host.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'host_rejected',
      'Host',
      hostId,
      host.email,
      { reason, notes }
    );

    res.json({ message: 'Host rejected successfully', host });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Suspend a host
export const suspendHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { reason = '', duration = 30 } = req.body;

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Host not found' });
    }

    host.hostStatus = 'suspended';
    host.hostSuspendedDate = new Date();
    host.suspensionReason = reason;
    host.suspensionDuration = duration;
    host.suspensionCount = (host.suspensionCount || 0) + 1;
    await host.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'host_suspended',
      'Host',
      hostId,
      host.email,
      { reason, duration, suspensionCount: host.suspensionCount }
    );

    res.json({ message: 'Host suspended successfully', host });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unsuspend a host
export const unsuspendHost = async (req, res) => {
  try {
    const { hostId } = req.params;
    const { notes = '' } = req.body;

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Host not found' });
    }

    if (host.hostStatus !== 'suspended') {
      return res.status(400).json({ error: 'Host is not suspended' });
    }

    host.hostStatus = 'approved';
    host.hostSuspendedDate = null;
    host.suspensionReason = null;
    await host.save();

    // Log action
    await logAdminAction(
      req.user._id,
      req.user.email,
      'host_unsuspended',
      'Host',
      hostId,
      host.email,
      { notes }
    );

    res.json({ message: 'Host unsuspended successfully', host });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get suspension history
export const getSuspensionHistory = async (req, res) => {
  try {
    const { hostId } = req.params;

    const host = await User.findById(hostId);
    if (!host || host.role !== 'host') {
      return res.status(404).json({ error: 'Host not found' });
    }

    // Get suspension records from AdminLog
    const suspensions = await AdminLog.find({
      targetId: hostId,
      $or: [
        { action: 'host_suspended' },
        { action: 'host_unsuspended' }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      hostId,
      hostName: host.name,
      totalSuspensions: host.suspensionCount || 0,
      history: suspensions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============ PHASE 5G: SETTINGS & CONFIGURATION ============

// Update commission rate (Phase 5G - allows updating specific tier)
export const updateCommissionRate = async (req, res) => {
  try {
    const { tier, rate } = req.body;
    const { adminId, adminEmail } = req.user;

    // Validate tier
    const validTiers = ['starter', 'growth', 'pro', 'elite'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // Validate rate (between 0 and 100)
    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'Rate must be between 0 and 100' });
    }

    let settings = await AdminSettings.findOne({});
    if (!settings) {
      settings = new AdminSettings({
        commissionRates: {
          starter: 25,
          growth: 20,
          pro: 15,
          elite: 10
        }
      });
    }

    const oldRate = settings.commissionRates[tier];
    settings.commissionRates[tier] = rate;
    settings.updatedAt = new Date();
    settings.updatedBy = adminId;
    await settings.save();

    // Log the change
    await logAdminAction(
      adminId,
      adminEmail,
      'COMMISSION_UPDATED',
      'Setting',
      'commission',
      null,
      { tier, oldRate, newRate: rate }
    );

    res.json({
      success: true,
      message: `Commission rate for ${tier} updated to ${rate}%`,
      commissionRates: settings.commissionRates
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get email templates
export const getEmailTemplates = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne({});
    if (!settings) {
      settings = new AdminSettings({});
      await settings.save();
    }

    const defaultTemplates = [
      {
        id: 'host-approved',
        name: 'Host Approved',
        subject: 'Congratulations! Your host account has been approved',
        body: 'Your host account has been approved. You can now create and manage classes.',
        variables: ['hostName', 'email', 'approvalDate']
      },
      {
        id: 'host-rejected',
        name: 'Host Rejected',
        subject: 'Update on Your Host Application',
        body: 'Unfortunately, your host application was not approved.',
        variables: ['hostName', 'reason']
      },
      {
        id: 'host-suspended',
        name: 'Host Suspended',
        subject: 'Important: Your Account Has Been Suspended',
        body: 'Your host account has been suspended due to policy violations.',
        variables: ['hostName', 'reason', 'duration']
      }
    ];

    const templates = settings.emailTemplates || defaultTemplates;
    res.json({ templates, total: templates.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get feature flags
export const getFeatureFlags = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne({});
    if (!settings) {
      settings = new AdminSettings({});
      await settings.save();
    }

    const defaultFlags = [
      {
        id: 'video-recording',
        name: 'Video Recording',
        description: 'Enable class video recording feature',
        enabled: true,
        rollout: 100,
        targetAudience: 'all'
      },
      {
        id: 'live-streaming',
        name: 'Live Streaming',
        description: 'Enable live stream classes',
        enabled: true,
        rollout: 100,
        targetAudience: 'all'
      }
    ];

    const flags = settings.featureFlags || defaultFlags;
    res.json({ flags, total: flags.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle feature flag
export const toggleFeatureFlag = async (req, res) => {
  try {
    const { featureId } = req.params;
    const { enabled } = req.body;
    const { adminId, adminEmail } = req.user;

    let settings = await AdminSettings.findOne({});
    if (!settings) {
      settings = new AdminSettings({});
    }

    if (!settings.featureFlags) {
      settings.featureFlags = [];
    }

    let flag = settings.featureFlags.find(f => f.id === featureId);
    if (!flag) {
      return res.status(404).json({ error: 'Feature flag not found' });
    }

    flag.enabled = enabled;
    settings.updatedAt = new Date();
    settings.updatedBy = adminId;
    await settings.save();

    await logAdminAction(adminId, adminEmail, 'FEATURE_TOGGLED', 'Setting', featureId, null, { featureId, enabled });

    res.json({
      success: true,
      message: `Feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`,
      flag
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get audit logs
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await AdminLog.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AdminLog.countDocuments({});

    res.json({
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export audit logs
export const exportAuditLogs = async (req, res) => {
  try {
    const logs = await AdminLog.find({}).sort({ createdAt: -1 });

    const csv = [
      ['Timestamp', 'Admin', 'Action', 'Target', 'Status'].join(','),
      ...logs.map(log =>
        [
          log.createdAt.toISOString(),
          log.adminEmail,
          log.action,
          log.targetId || 'N/A',
          log.status
        ].join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update email template
export const updateEmailTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const { subject, body, variables } = req.body;

    if (!templateId || !subject || !body) {
      return res.status(400).json({ message: 'Template ID, subject, and body are required' });
    }

    let settings = await AdminSettings.findOne({});
    if (!settings) {
      settings = new AdminSettings({ emailTemplates: [] });
    }

    const templateIndex = settings.emailTemplates.findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
      return res.status(404).json({ message: 'Template not found' });
    }

    settings.emailTemplates[templateIndex] = {
      ...settings.emailTemplates[templateIndex],
      subject,
      body,
      variables: variables || []
    };

    await settings.save();

    // Log admin action
    await logAdminAction(req.user.email, 'update_email_template', 'EmailTemplate', templateId, 'success', {
      template: templateId,
      subject,
      bodyLength: body.length
    });

    res.json({
      message: 'Email template updated successfully',
      template: settings.emailTemplates[templateIndex]
    });
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({ error: error.message });
  }
};

