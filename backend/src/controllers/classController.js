import Class from '../models/Class.js';
import mongoose from 'mongoose';
import Session from '../models/Session.js';
import { generateSessionsForFixed, generateSessionsOngoing } from '../utils/sessions.js';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import Notification from '../models/Notification.js';
import StrikeEvent from '../models/StrikeEvent.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { fromZonedTime } from 'date-fns-tz';
import { getVacationDays, canStartVacation } from '../utils/vacations.js';

const appearancePalette = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#E11D48', '#0891B2', '#475569', '#2563EB'];
const slugify = (value) => value.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
const stripTitleCharacters = (value) => value.replace(/[\u0000-\u001F\u007F-\u009F\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\s+/g, ' ').trim();

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
      timezone,
      totalDays,
      videoMode,
      externalVideoLink,
      maxStudents,
      isPublic,
    } = req.body;

    if (!title?.trim() || !description?.trim() || !category || monthlyPrice === undefined || monthlyPrice === '') {
      return res.status(400).json({ message: 'Title, description, category, and monthly price are required' });
    }

    const parsedPrice = Number(monthlyPrice);
    const parsedMaxStudents = Number(maxStudents);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Monthly price must be a valid non-negative number' });
    }
    if (maxStudents !== undefined && (!Number.isInteger(parsedMaxStudents) || parsedMaxStudents < 1)) {
      return res.status(400).json({ message: 'Maximum students must be a positive whole number' });
    }
    if (!Array.isArray(schedule) || schedule.length === 0) {
      return res.status(400).json({ message: 'Add at least one recurring schedule time' });
    }
    for (const item of schedule) {
      if (!Number.isInteger(Number(item.dayOfWeek)) || Number(item.dayOfWeek) < 0 || Number(item.dayOfWeek) > 6) {
        return res.status(400).json({ message: 'Each schedule day must be between Sunday and Saturday' });
      }
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime)) {
        return res.status(400).json({ message: 'Schedule times must use HH:mm format' });
      }
      if (!Number.isInteger(Number(item.durationMinutes || item.duration)) || Number(item.durationMinutes || item.duration) < 1) {
        return res.status(400).json({ message: 'Schedule duration must be a positive number of minutes' });
      }
    }

    const supportedTimezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [];
    if (timezone && timezone !== 'UTC' && !supportedTimezones.includes(timezone)) {
      return res.status(400).json({ message: 'Timezone must be a valid IANA timezone' });
    }
    if (durationType === 'fixed' && (!startDate || !endDate || differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) < 1)) {
      return res.status(400).json({ message: 'Fixed-duration classes need a valid start and end date' });
    }
    if (durationType === 'fixed' && startDate < formatInTimeZone(new Date(), timezone || 'UTC', 'yyyy-MM-dd')) {
      return res.status(400).json({ message: 'Fixed classes must start today or later' });
    }
    if (durationType === 'fixed') {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const hasOccurrence = schedule.some((item) => {
        for (const day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
          if (day.getUTCDay() === Number(item.dayOfWeek)) return true;
        }
        return false;
      });
      if (!hasOccurrence) return res.status(400).json({ message: 'Fixed classes need at least one scheduled occurrence between their dates' });
    }
    if (videoMode === 'external' && externalVideoLink) {
      try {
        if (new URL(externalVideoLink).protocol !== 'https:') throw new Error('invalid protocol');
      } catch {
        return res.status(400).json({ message: 'External meeting links must use HTTPS' });
      }
    }
    
    const normalizedSchedule = schedule.map((item) => {
      return {
        ...item,
        dayOfWeek: Number(item.dayOfWeek),
        duration: Number(item.durationMinutes || item.duration),
        durationMinutes: Number(item.durationMinutes || item.duration),
      };
    });

    const classData = new Class({
      title: stripTitleCharacters(title),
      description,
      category,
      tags,
      hostId: req.user.userId,
      monthlyPrice: parsedPrice,
      minPurchaseDays,
      durationType,
      startDate: startDate ? parseISO(startDate) : null,
      endDate: endDate ? parseISO(endDate) : null,
      totalDays: totalDays || (durationType === 'fixed' ? differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1 : null),
      timezone: timezone || 'UTC',
      schedule: normalizedSchedule,
      videoMode,
      externalVideoLink,
      maxStudents: parsedMaxStudents || undefined,
      isPublic,
    });
    
    await classData.save();
    
    // Generate sessions based on schedule
    if (schedule && schedule.length > 0) {
      const rawSessions = classData.durationType === 'fixed'
        ? generateSessionsForFixed(classData, normalizedSchedule)
        : generateSessionsOngoing(classData, normalizedSchedule, classData.startDate || new Date(), 8);
      const sessions = rawSessions.map((session) => ({
        classId: classData._id,
        scheduledStartTime: session.startUtc,
        scheduledEndTime: session.endUtc,
        timezone: session.timezone,
        status: session.status,
      }));
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
    const identifier = req.params.classId;
    const classFilter = mongoose.isValidObjectId(identifier)
      ? { _id: identifier }
      : { 'appearance.slug': identifier };
    const classData = await Class.findOne(classFilter).populate('hostId', 'firstName lastName');
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Get sessions
    const sessions = await Session.find({ classId: classData._id }).sort({ scheduledStartTime: 1 });
    
    const classObject = classData.toObject();
    const daysRemaining = classData.durationType === 'fixed' && classData.endDate
      ? Math.max(0, Math.ceil((new Date(classData.endDate).getTime() - Date.now()) / 86400000))
      : null;
    res.json({
      ...classObject,
      monthlyPriceCents: Math.round(Number(classData.monthlyPrice || 0) * 100),
      daysRemaining,
      thumbnail: classData.appearance?.thumbnailImage || classData.thumbnailImage || '',
      sessions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const { category, search, skip = 0, limit = 20 } = req.query;
    
    let filter = { isPublic: true, status: { $in: ['published', 'active'] } };
    
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

export const getOwnedClass = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.classId)) return res.status(404).json({ message: 'Class not found' });
  try {
    const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId }).populate('hostId', 'firstName lastName email timezone planTier');
    if (!classData) return res.status(404).json({ message: 'Class not found' });
    return res.json(classData);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load class settings' });
  }
};

export const updateClassPrice = async (req, res) => {
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId });
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  const nextPrice = Number(req.body.monthlyPrice);
  if (!Number.isFinite(nextPrice) || nextPrice < 5 || nextPrice > 1000) return res.status(400).json({ message: 'Price must be between $5 and $1,000' });
  if (classData.lastPriceChangeAt && Date.now() - new Date(classData.lastPriceChangeAt).getTime() < 30 * 86400000) {
    const available = new Date(new Date(classData.lastPriceChangeAt).getTime() + 30 * 86400000);
    return res.status(409).json({ message: `You can change the price again on ${available.toISOString().slice(0, 10)}` });
  }
  if (nextPrice > classData.monthlyPrice * 1.5) return res.status(400).json({ message: 'A price increase cannot exceed 50% at once' });
  const previousPrice = classData.monthlyPrice;
  classData.monthlyPrice = nextPrice;
  classData.lastPriceChangeAt = new Date();
  classData.priceChangeAudit.push({ changedAt: new Date(), previousPrice, newPrice: nextPrice, changedBy: req.user.userId });
  await classData.save();
  res.json({ message: 'Price updated. Existing students keep their current price.', class: classData });
};

export const duplicateClass = async (req, res) => {
  const source = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId }).lean();
  if (!source) return res.status(404).json({ message: 'Class not found' });
  const { _id, createdAt, updatedAt, totalEnrolled, averageRating, totalReviews, priceChangeAudit, lastPriceChangeAt, ...settings } = source;
  const duplicate = await Class.create({ ...settings, title: `${source.title} (Copy)`, hostId: req.user.userId, status: 'draft', totalEnrolled: 0, averageRating: 0, totalReviews: 0, priceChangeAudit: [] });
  const generated = duplicate.durationType === 'fixed'
    ? generateSessionsForFixed(duplicate, duplicate.schedule)
    : generateSessionsOngoing(duplicate, duplicate.schedule, duplicate.startDate || new Date(), 8);
  if (generated.length) {
    await Session.insertMany(generated.map((session) => ({
      classId: duplicate._id,
      scheduledStartTime: session.startUtc,
      scheduledEndTime: session.endUtc,
      timezone: session.timezone,
      status: 'scheduled',
    })));
  }
  res.status(201).json({ message: 'Class duplicated as a draft', class: duplicate });
};

export const archiveClass = async (req, res) => {
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId });
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  if (classData.status === 'archived') return res.json({ message: 'Class is already archived', class: classData });
  classData.status = 'archived';
  await classData.save();
  res.json({ message: 'Class archived', class: classData });
};

export const updateVacationMode = async (req, res) => {
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId });
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  if (classData.status === 'archived') return res.status(409).json({ message: 'Archived classes are read-only' });

  const { active, startDate, endDate } = req.body;
  if (!active) {
    classData.vacationMode = { active: false };
    await classData.save();
    return res.json({ message: 'Vacation mode disabled. Access dates remain extended.', class: classData });
  }
  if (!startDate || !endDate) return res.status(400).json({ message: 'Vacation start and end dates are required' });
  let pausedDays;
  try {
    pausedDays = getVacationDays(startDate, endDate);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
  if (pausedDays > 14) return res.status(400).json({ message: 'Vacation mode can last no more than 14 days' });
  if (!canStartVacation(classData.vacationHistory, new Date())) {
    return res.status(409).json({ message: 'This class has already used two vacations in the last 90 days' });
  }

  const timezone = classData.timezone || 'UTC';
  const rangeStart = fromZonedTime(`${startDate}T00:00:00`, timezone);
  const rangeEnd = fromZonedTime(`${endDate}T23:59:59`, timezone);
  const affectedSessions = await Session.find({
    classId: classData._id,
    status: 'scheduled',
    scheduledStartTime: { $gte: rangeStart, $lte: rangeEnd },
  });
  if (affectedSessions.length) {
    await Session.updateMany(
      { _id: { $in: affectedSessions.map((session) => session._id) } },
      { $set: { status: 'cancelled', cancellationReason: 'Class vacation' } },
    );
  }

  const subscriptions = await Subscription.find({ classId: classData._id, status: 'active' });
  const extensionMs = pausedDays * 24 * 60 * 60 * 1000;
  for (const subscription of subscriptions) {
    if (subscription.endDate) subscription.endDate = new Date(subscription.endDate.getTime() + extensionMs);
    if (subscription.accessCodeValidUntil) subscription.accessCodeValidUntil = new Date(subscription.accessCodeValidUntil.getTime() + extensionMs);
    await subscription.save();
  }
  const startedAt = fromZonedTime(`${startDate}T00:00:00`, timezone);
  const endedAt = fromZonedTime(`${endDate}T23:59:59`, timezone);
  classData.vacationMode = { active: true, startDate: startedAt, endDate: endedAt };
  classData.vacationHistory.push({ startedAt, endedAt, pausedDays });
  await classData.save();
  res.json({ message: `Vacation mode enabled for ${pausedDays} days`, class: classData, pausedDays });
};

export const getClassSessions = async (req, res) => {
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId });
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  const sessions = await Session.find({ classId: classData._id }).sort({ scheduledStartTime: 1 });
  res.json(sessions);
};

export const addBonusSession = async (req, res) => {
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId });
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  const { startUtc, endUtc, durationMinutes, timezone } = req.body;
  const start = parseISO(startUtc);
  const end = endUtc ? parseISO(endUtc) : new Date(start.getTime() + Number(durationMinutes || 60) * 60000);
  if (Number.isNaN(start.getTime()) || end <= start) return res.status(400).json({ message: 'A valid session time is required' });
  const session = await Session.create({ classId: classData._id, scheduledStartTime: start, scheduledEndTime: end, timezone: timezone || classData.timezone, scheduleId: null, status: 'scheduled' });
  res.status(201).json(session);
};

export const cancelClassSession = async (req, res) => {
  const session = await Session.findById(req.params.sessionId).populate('classId');
  if (!session || session.classId.hostId.toString() !== req.user.userId) return res.status(404).json({ message: 'Session not found' });
  const reason = req.body.reason?.trim();
  if (!reason) return res.status(400).json({ message: 'A cancellation reason is required' });
  const now = new Date();
  const hoursUntilStart = (session.scheduledStartTime - now) / 3600000;
  session.status = 'cancelled';
  session.cancellationReason = reason;
  await session.save();
  const subscriptions = await Subscription.find({ classId: session.classId._id, status: 'active' }).select('userId');
  if (subscriptions.length) {
    await Notification.insertMany(subscriptions.map(({ userId }) => ({ userId, type: 'class_cancellation', title: 'Session cancelled', message: `A session was cancelled: ${reason}`, relatedClassId: session.classId._id, metadata: { sessionId: session._id } })));
  }
  if (hoursUntilStart < 2) await StrikeEvent.create({ hostId: req.user.userId, type: 'late_cancellation', sessionId: session._id, reason });
  res.json({ message: 'Session cancelled', strikeRecorded: hoursUntilStart < 2, session });
};

export const notifyRunningLate = async (req, res) => {
  const session = await Session.findById(req.params.sessionId).populate('classId');
  if (!session || session.classId.hostId.toString() !== req.user.userId) return res.status(404).json({ message: 'Session not found' });
  if (session.status !== 'scheduled' || session.scheduledStartTime <= new Date()) {
    return res.status(400).json({ message: 'Running-late notices are only available for upcoming sessions' });
  }
  if (session.runningLateNotifiedAt) {
    return res.status(409).json({ message: 'A running-late notice has already been sent for this session' });
  }
  const subscriptions = await Subscription.find({ classId: session.classId._id, status: 'active' }).select('userId');
  if (subscriptions.length) await Notification.insertMany(subscriptions.map(({ userId }) => ({ userId, type: 'class_announcement', title: 'Your host is running late', message: 'Your host is running ~15 min late.', relatedClassId: session.classId._id, metadata: { sessionId: session._id } })));
  session.runningLateNotifiedAt = new Date();
  await session.save();
  res.json({ message: 'Students notified' });
};

export const updateSessionMeetingUrl = async (req, res) => {
  const session = await Session.findById(req.params.sessionId).populate('classId');
  if (!session || session.classId.hostId.toString() !== req.user.userId) return res.status(404).json({ message: 'Session not found' });
  const { meetingUrl = '' } = req.body;
  if (meetingUrl) {
    try {
      if (new URL(meetingUrl).protocol !== 'https:') throw new Error('invalid');
    } catch {
      return res.status(400).json({ message: 'Meeting links must use HTTPS' });
    }
  }
  session.meetingUrl = meetingUrl;
  await session.save();
  res.json(session);
};

export const setPreviewSession = async (req, res) => {
  const session = await Session.findById(req.params.sessionId).populate('classId');
  if (!session || session.classId.hostId.toString() !== req.user.userId) return res.status(404).json({ message: 'Session not found' });
  if (session.status !== 'scheduled' || session.scheduledStartTime <= new Date()) return res.status(400).json({ message: 'Only upcoming sessions can be previews' });
  const monthStart = new Date(session.scheduledStartTime.getFullYear(), session.scheduledStartTime.getMonth(), 1);
  const monthEnd = new Date(session.scheduledStartTime.getFullYear(), session.scheduledStartTime.getMonth() + 1, 1);
  await Session.updateMany({
    classId: session.classId._id,
    scheduledStartTime: { $gte: monthStart, $lt: monthEnd },
    _id: { $ne: session._id },
  }, { $set: { isPreviewSession: false } });
  session.isPreviewSession = req.body.enabled !== false;
  await session.save();
  res.json(session);
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
    if (classData.status === 'archived') {
      return res.status(409).json({ message: 'Archived classes are read-only' });
    }

    const editableFields = [
      'title', 'description', 'category', 'tags', 'monthlyPrice', 'minPurchaseDays',
      'durationType', 'startDate', 'endDate', 'totalDays', 'timezone', 'schedule',
      'videoMode', 'externalVideoLink', 'maxStudents', 'isPublic', 'status',
      'thumbnailImage', 'introVideoUrl', 'introVideoTranscript', 'autoRecord',
      'recordingAvailability', 'recordingAutoDelete', 'watermarkEnabled',
      'appearance',
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => editableFields.includes(key)));
    if (updates.title !== undefined) {
      const cleanTitle = stripTitleCharacters(updates.title);
      updates.title = cleanTitle;
    }
    if (updates.title !== undefined && !updates.title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (updates.tags !== undefined && (!Array.isArray(updates.tags) || updates.tags.length > 10)) {
      return res.status(400).json({ message: 'Add no more than 10 tags' });
    }
    if (updates.appearance) {
      const host = await User.findById(req.user.userId).select('planTier');
      const tier = host?.planTier || 'starter';
      const appearance = { ...(classData.appearance?.toObject?.() || classData.appearance || {}), ...updates.appearance };
      if (appearance.accentColor && !appearancePalette.includes(appearance.accentColor)) {
        return res.status(400).json({ message: 'Choose an accent color from the approved palette' });
      }
      if ((appearance.accentColor || appearance.hostLogo) && !['pro', 'elite'].includes(tier)) {
        return res.status(403).json({ message: 'Accent color and host logo unlock at Pro — 73 active paying students' });
      }
      if (appearance.slug && classData.status !== 'draft') {
        return res.status(409).json({ message: 'Slugs lock at publish so student links never break.' });
      }
      if (appearance.slug && tier !== 'elite') {
        return res.status(403).json({ message: 'Class URL slugs unlock at Elite' });
      }
      if (appearance.slug) {
        appearance.slug = slugify(appearance.slug);
        const existing = await Class.findOne({ 'appearance.slug': appearance.slug, _id: { $ne: classData._id } });
        if (existing) return res.status(409).json({ message: 'That class URL slug is already in use' });
      }
      if (Array.isArray(appearance.gallery) && appearance.gallery.length > 6) {
        return res.status(400).json({ message: 'A class gallery can contain no more than 6 images' });
      }
      const images = [
        appearance.thumbnailImage,
        appearance.bannerImage,
        appearance.hostLogo,
        ...(Array.isArray(appearance.gallery) ? appearance.gallery.map((item) => item.url) : []),
      ];
      for (const image of images) {
        if (image && typeof image === 'string' && !/^data:image\/(jpeg|png|svg\+xml);base64,/.test(image) && !/^https?:\/\//.test(image)) {
          return res.status(400).json({ message: 'Images must be JPEG, PNG, SVG, or HTTPS URLs' });
        }
        if (image && typeof image === 'string' && image.startsWith('data:') && image.length > 8 * 1024 * 1024) {
          return res.status(413).json({ message: 'Uploaded image is too large' });
        }
      }
      if (Array.isArray(appearance.gallery) && appearance.gallery.some((item) => (item.caption || '').length > 80)) {
        return res.status(400).json({ message: 'Gallery captions must be 80 characters or fewer' });
      }
      classData.appearance = appearance;
      if (appearance.thumbnailImage) classData.thumbnailImage = appearance.thumbnailImage;
    }
    if (updates.status && updates.status !== classData.status) {
      const activeSubscriptions = await Subscription.countDocuments({ classId: classData._id, status: 'active' });
      if (updates.status === 'published') {
        const host = await User.findById(req.user.userId).select('hostVerified emailPreferences.emailVerified');
        if (!host?.hostVerified && !host?.emailPreferences?.emailVerified) {
          return res.status(403).json({ message: 'Verify your email/identity to publish' });
        }
        const next = { ...classData.toObject(), ...updates };
        if (!next.title?.trim() || !next.description?.trim() || !next.category || !next.monthlyPrice || !next.schedule?.length || (!next.thumbnailImage && !next.introVideoUrl)) {
          return res.status(400).json({ message: 'Title, description, category, schedule, price, and a thumbnail or intro video are required to publish' });
        }
      }
      if (classData.status === 'published' && updates.status === 'draft' && activeSubscriptions > 0) {
        return res.status(409).json({ message: 'Classes with active subscriptions cannot return to draft' });
      }
      if (updates.status === 'active' && !['published', 'active'].includes(classData.status)) {
        return res.status(400).json({ message: 'Only published classes can become active' });
      }
    }

    const scheduleChanged = updates.schedule !== undefined
      || updates.startDate !== undefined
      || updates.endDate !== undefined
      || updates.durationType !== undefined
      || updates.timezone !== undefined;
    const nextSchedule = updates.schedule || classData.schedule;
    Object.assign(classData, updates);
    if (updates.startDate) classData.startDate = parseISO(updates.startDate);
    if (updates.endDate) classData.endDate = parseISO(updates.endDate);
    if (updates.totalDays === undefined && classData.durationType === 'fixed' && classData.startDate && classData.endDate) {
      classData.totalDays = differenceInCalendarDays(classData.endDate, classData.startDate) + 1;
    }
    await classData.save();

    if (scheduleChanged) {
      const now = new Date();
      await Session.deleteMany({ classId: classData._id, scheduledStartTime: { $gt: now } });
      const generated = classData.durationType === 'fixed'
        ? generateSessionsForFixed(classData, nextSchedule)
        : generateSessionsOngoing(classData, nextSchedule, now, 8);
      const futureSessions = generated
        .filter((session) => session.startUtc > now.toISOString())
        .map((session) => ({
          classId: classData._id,
          scheduledStartTime: session.startUtc,
          scheduledEndTime: session.endUtc,
          timezone: session.timezone,
          status: 'scheduled',
        }));
      if (futureSessions.length) await Session.insertMany(futureSessions);
    }
    
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
