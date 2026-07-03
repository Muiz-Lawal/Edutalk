import Class from '../models/Class.js';
import Session from '../models/Session.js';

export const createClass = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      monthlyPrice,
      minPurchaseDays,
      durationType,
      startDate,
      endDate,
      schedule,
      videoMode,
      externalVideoLink,
      maxStudents,
      isPublic,
    } = req.body;
    
    const classData = new Class({
      title,
      description,
      category,
      tags,
      hostId: req.user.userId,
      monthlyPrice,
      minPurchaseDays,
      durationType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      schedule,
      videoMode,
      externalVideoLink,
      maxStudents,
      isPublic,
    });
    
    await classData.save();
    
    // Generate sessions based on schedule
    if (schedule && schedule.length > 0) {
      const sessions = generateSessionsFromSchedule(classData._id, schedule, classData.startDate, classData.endDate);
      await Session.insertMany(sessions);
    }
    
    res.status(201).json({
      message: 'Class created successfully',
      class: classData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId).populate('hostId', '-password');
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Get sessions
    const sessions = await Session.find({ classId: classData._id }).sort({ scheduledStartTime: 1 });
    
    res.json({
      ...classData.toObject(),
      sessions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const { category, search, skip = 0, limit = 20 } = req.query;
    
    let filter = { isPublic: true, status: 'active' };
    
    if (category) {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    
    const classes = await Class.find(filter)
      .populate('hostId', '-password')
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Class.countDocuments(filter);
    
    res.json({
      classes,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHostClasses = async (req, res) => {
  try {
    const classes = await Class.find({ hostId: req.user.userId }).sort({ createdAt: -1 });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (classData.hostId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this class' });
    }
    
    Object.assign(classData, req.body);
    await classData.save();
    
    res.json({ message: 'Class updated successfully', class: classData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    const classData = await Class.findById(req.params.classId);
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    if (classData.hostId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this class' });
    }
    
    await Class.findByIdAndDelete(req.params.classId);
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to generate sessions from schedule
function generateSessionsFromSchedule(classId, schedule, startDate, endDate) {
  const sessions = [];
  const now = new Date();
  
  // Default to 30 days if no dates provided
  const start = startDate ? new Date(startDate) : now;
  const end = endDate ? new Date(endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const scheduleForDay = schedule.find(s => s.dayOfWeek === dayOfWeek);
    
    if (scheduleForDay) {
      const [hours, minutes] = scheduleForDay.startTime.split(':').map(Number);
      const sessionStart = new Date(d);
      sessionStart.setHours(hours, minutes, 0, 0);
      
      const sessionEnd = new Date(sessionStart);
      sessionEnd.setMinutes(sessionEnd.getMinutes() + (scheduleForDay.duration || 60));
      
      sessions.push({
        classId,
        scheduledStartTime: sessionStart,
        scheduledEndTime: sessionEnd,
        status: 'scheduled',
      });
    }
  }
  
  return sessions;
}
