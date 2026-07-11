import ClassMVP from '../models/ClassMVP.js';
import SessionMVP from '../models/SessionMVP.js';
import User from '../models/User.js';
import { generateSessionsForClass, getUpcomingSessions } from '../utils/sessionGenerator.js';
import { calculatePrice, getAllPriceTiers } from '../utils/pricingEngine.js';

/**
 * Create a new class (Host only)
 * POST /api/classes
 */
export const createClass = async (req, res) => {
  try {
    const { title, description, category, monthlyPrice, minStudents, maxStudents, schedule } = req.body;
    const hostId = req.user.userId || req.user._id || req.user.id;

    // Validate required fields
    if (!title || !description || !category || !monthlyPrice || !schedule || schedule.length === 0) {
      return res.status(400).json({ 
        message: 'Missing required fields: title, description, category, monthlyPrice, schedule' 
      });
    }

    // Validate schedule format
    for (const item of schedule) {
      if (!item.dayOfWeek || item.dayOfWeek < 0 || item.dayOfWeek > 6) {
        return res.status(400).json({ message: 'Invalid dayOfWeek. Must be 0-6' });
      }
      if (!item.startTime || !item.endTime) {
        return res.status(400).json({ message: 'Each schedule item must have startTime and endTime' });
      }
    }

    // Get host's plan tier for pricing multipliers
    const host = await User.findById(hostId);
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    // Create class document
    const newClass = new ClassMVP({
      hostId,
      title: title.trim(),
      description: description.trim(),
      category,
      monthlyPrice: parseFloat(monthlyPrice),
      minStudents: minStudents || 1,
      maxStudents: maxStudents || 100,
      schedule,
      planTier: host.planTier || 'starter',
      status: 'active',
    });

    await newClass.save();

    // Generate sessions for next 8 weeks
    const sessions = await generateSessionsForClass(newClass, 8);

    res.status(201).json({
      message: 'Class created successfully',
      class: {
        id: newClass._id,
        title: newClass.title,
        description: newClass.description,
        category: newClass.category,
        monthlyPrice: newClass.monthlyPrice,
        schedule: newClass.schedule,
        status: newClass.status,
        sessionsGenerated: sessions.length,
      },
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all classes with filters and pagination (Public)
 * GET /api/classes?category=Math&page=1&limit=10&search=
 */
export const getClasses = async (req, res) => {
  try {
    const { category, page = 1, limit = 12, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { status: 'active' };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await ClassMVP.countDocuments(query);

    // Get paginated classes
    const classes = await ClassMVP.find(query)
      .populate('hostId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const pages = Math.ceil(total / limit);

    res.json({
      classes,
      pagination: {
        total,
        pages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get single class details (Public)
 * GET /api/classes/:id
 */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classDoc = await ClassMVP.findById(id).populate('hostId', 'firstName lastName email bio');

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get upcoming sessions
    const sessions = await getUpcomingSessions(id);

    // Get pricing tiers for display
    const pricingTiers = getAllPriceTiers(classDoc.monthlyPrice);

    res.json({
      class: classDoc,
      sessions: sessions.slice(0, 5), // First 5 upcoming sessions
      pricingTiers,
      totalSessions: sessions.length,
    });
  } catch (error) {
    console.error('Get class by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get host's classes (Host only)
 * GET /api/classes/host/my-classes
 */
export const getHostClasses = async (req, res) => {
  try {
    const hostId = req.user.userId || req.user._id || req.user.id;

    const classes = await ClassMVP.find({ hostId })
      .sort({ createdAt: -1 });

    res.json({
      classes,
      total: classes.length,
    });
  } catch (error) {
    console.error('Get host classes error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a class (Host only)
 * PUT /api/classes/:id
 */
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId || req.user._id || req.user.id;
    const { title, description, category, monthlyPrice, minStudents, maxStudents, schedule, status } = req.body;

    const classDoc = await ClassMVP.findById(id);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check authorization
    if (classDoc.hostId.toString() !== hostId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this class' });
    }

    // Update fields
    if (title) classDoc.title = title.trim();
    if (description) classDoc.description = description.trim();
    if (category) classDoc.category = category;
    if (monthlyPrice) classDoc.monthlyPrice = parseFloat(monthlyPrice);
    if (minStudents) classDoc.minStudents = minStudents;
    if (maxStudents) classDoc.maxStudents = maxStudents;
    if (schedule) classDoc.schedule = schedule;
    if (status) classDoc.status = status;

    classDoc.updatedAt = new Date();

    await classDoc.save();

    res.json({
      message: 'Class updated successfully',
      class: classDoc,
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a class (Host only)
 * DELETE /api/classes/:id
 */
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.user.userId || req.user._id || req.user.id;

    const classDoc = await ClassMVP.findById(id);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check authorization
    if (classDoc.hostId.toString() !== hostId.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }

    // Delete class
    await ClassMVP.findByIdAndDelete(id);

    // Delete associated sessions
    await SessionMVP.deleteMany({ classId: id });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get class schedule with upcoming sessions
 * GET /api/classes/:id/schedule
 */
export const getClassSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const classDoc = await ClassMVP.findById(id);

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Get upcoming sessions
    const sessions = await getUpcomingSessions(id);

    res.json({
      schedule: classDoc.schedule,
      upcomingSessions: sessions,
      totalUpcoming: sessions.length,
    });
  } catch (error) {
    console.error('Get class schedule error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get pricing calculation
 * GET /api/pricing?monthlyPrice=100&days=15
 */
export const calculatePricing = async (req, res) => {
  try {
    const { monthlyPrice, days } = req.query;

    if (!monthlyPrice || !days) {
      return res.status(400).json({ message: 'monthlyPrice and days are required' });
    }

    const pricing = calculatePrice(parseFloat(monthlyPrice), parseInt(days));

    res.json(pricing);
  } catch (error) {
    console.error('Calculate pricing error:', error);
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get categories (for filters)
 * GET /api/classes/categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = ['Math', 'Science', 'Language', 'Technology', 'Arts', 'Business', 'Health', 'Other'];
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: error.message });
  }
};
