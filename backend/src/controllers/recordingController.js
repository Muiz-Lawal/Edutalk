import Recording from '../models/Recording.js';
import crypto from 'crypto';
import WatchHistory from '../models/WatchHistory.js';
import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import PlaybackProgress from '../models/PlaybackProgress.js';
import PlaybackAnomaly from '../models/PlaybackAnomaly.js';
import Event from '../models/Event.js';
import RecordingLibrary from '../models/RecordingLibrary.js';
import {
  isTrustedDeviceAllowed,
  generateTrustedDeviceFingerprint,
  isWithinAccessWindow,
  registerTrustedDevice,
} from '../utils/accessCode.js';
import { recordingProvider } from '../services/recording-provider.js';
import { transcribeAudio, summarizeContent, generateChapters } from '../utils/ai.js';
import { assertFeature, planGateResponse } from '../utils/plan-limits.js';
import { fanOutRecordingToActiveStudents } from '../services/recordingLibrary.js';

const PRO_TIERS = new Set(['pro', 'elite']);
const safeRecording = (recording, progress = null) => ({
  id: recording._id,
  sessionId: recording.sessionId,
  classId: recording.classId,
  title: recording.title,
  description: recording.description,
  thumbnail: recording.thumbnail,
  durationSeconds: recording.durationSeconds || recording.duration || 0,
  status: recording.status,
  isVisible: recording.isVisible,
  releaseAt: recording.releaseAt,
  reviewHoldUntil: recording.reviewHoldUntil,
  holdRemainingSeconds: recording.reviewHoldUntil
    ? Math.max(0, Math.ceil((new Date(recording.reviewHoldUntil).getTime() - Date.now()) / 1000))
    : 0,
  autoDeleteAt: recording.autoDeleteAt,
  autoDeleteEnabled: recording.autoDeleteEnabled,
  transcript: recording.transcript,
  transcriptSegments: recording.transcriptSegments || [],
  aiSummary: recording.aiSummary || recording.summary,
  aiTimestamps: recording.aiTimestamps || recording.chapters || [],
  aiKeyTakeaways: recording.aiKeyTakeaways || recording.keyTakeaways || [],
  watermarkOverlayEnabled: recording.watermarkOverlayEnabled !== false,
  hostPlanTier: recording.hostPlanTier,
  progress,
});

const assertRecordingFeature = async (req, res) => {
  try {
    await assertFeature(req.user.userId, 'recording');
    return true;
  } catch (error) {
    if (planGateResponse(error, res)) return false;
    res.status(500).json({ message: 'Unable to use recordings.' });
    return false;
  }
};

const requireProClass = async (classId) => {
  const classData = await Class.findById(classId).populate('hostId', 'planTier activatedPlanTier suspendedAt bannedAt');
  if (!classData) return { error: { status: 404, message: 'Class not found' } };
  if (!PRO_TIERS.has(classData.hostId?.activatedPlanTier || classData.hostId?.planTier)) return { error: { status: 404, message: 'Recording not found' } };
  return { classData };
};

/**
 * 1. Get all public recordings with pagination and filtering
 */
export const getRecordings = async (req, res) => {
  try {
    const { classId, page = 1, limit = 20, sortBy = 'uploadedAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query for public recordings
    const query = {
      isPublic: true,
      isDeleted: false,
      status: 'ready',
    };

    // Filter by classId if provided
    if (classId) {
      query.classId = classId;
    }

    // Get recordings with pagination and sort
    const recordings = await Recording.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ uploadedAt: -1 })
      .select('_id title description thumbnail duration resolution viewCount rating uploadedAt hostId classId');

    // Get total count for pagination
    const total = await Recording.countDocuments(query);

    res.json({
      data: recordings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recordings', error: error.message });
  }
};

/**
 * 2. Get single recording by ID with full details
 */
export const getRecordingById = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.user?.userId;

    // Find recording
    const recording = await Recording.findById(recordingId)
      .populate('hostId', '_id name email avatar')
      .populate('classId', '_id title');

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check access control
    if (!recording.isPublic && recording.hostId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: This is a private recording' });
    }

    // If recording is soft deleted, return 404
    if (recording.isDeleted) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    res.json({ data: safeRecording(recording) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recording', error: error.message });
  }
};

/**
 * 3. Track recording view and create watch history
 */
export const trackRecordingView = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { watchedSeconds } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find recording
    const recording = await Recording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user has access (public or owner)
    if (!recording.isPublic && recording.hostId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    recording.viewCount = (recording.viewCount || 0) + 1;
    await recording.save();

    // Create or update watch history
    const finished = watchedSeconds && recording.duration ? watchedSeconds >= recording.duration * 0.95 : false;

    const watchHistory = await WatchHistory.findOneAndUpdate(
      { userId, recordingId },
      {
        userId,
        recordingId,
        watchedAt: new Date(),
        duration: watchedSeconds || 0,
        lastPosition: watchedSeconds || 0,
        finished: finished,
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Watch history recorded',
      data: {
        viewCount: recording.viewCount,
        watchHistory: watchHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking view', error: error.message });
  }
};

/**
 * 4. Get user's own recordings (for host/creator)
 */
export const getUserRecordings = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all recordings owned by user (public and private)
    const recordings = await Recording.find({
      hostId: userId,
      isDeleted: false,
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ uploadedAt: -1 })
      .populate('classId', '_id title')
      .select('_id title description thumbnail duration durationSeconds resolution viewCount rating uploadedAt status isVisible releaseAt transcript summary keyTakeaways chapters');

    // Get total count
    const total = await Recording.countDocuments({
      hostId: userId,
      isDeleted: false,
    });

    res.json({
      data: recordings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user recordings', error: error.message });
  }
};

/**
 * 5. Delete a recording (soft delete)
 */
export const deleteRecording = async (req, res) => {
  try {
    if (!await assertRecordingFeature(req, res)) return;
    const { recordingId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find recording
    const recording = await Recording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user is the owner
    if (recording.hostId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: Only the recording owner can delete this recording' });
    }

    await recordingProvider.deleteRecording(recording.streamUid);
    // Soft delete
    recording.isDeleted = true;
    recording.updatedAt = new Date();
    await recording.save();

    res.json({
      message: 'Recording deleted successfully',
      data: {
        recordingId: recording._id,
        deletedAt: recording.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recording', error: error.message });
  }
};

export const playRecording = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ code: 'authentication_required', message: 'Log in to watch this recording' });
    const user = await User.findById(userId).select('email firstName lastName emailPreferences');
    if (!user) return res.status(401).json({ code: 'authentication_required', message: 'Log in to watch this recording' });
    if (!user.emailPreferences?.emailVerified) return res.status(403).json({ code: 'email_verification_required', message: 'Verify your email before watching recordings' });
    const recording = await Recording.findById(req.params.recordingId);
    if (!recording || recording.isDeleted) return res.status(404).json({ code: 'recording_not_found', message: 'Recording not found' });
    if (!PRO_TIERS.has(recording.hostPlanTier)) return res.status(403).json({ code: 'recording_plan_locked', message: 'This recording is not available on the host plan that created it' });
    if (recording.status !== 'ready') return res.status(403).json({ code: 'recording_not_ready', message: recording.status === 'review_hold' ? 'This recording is awaiting host review' : 'This recording is still being prepared' });
    const now = new Date();
    const session = recording.sessionId
      ? await Session.findById(recording.sessionId).select('scheduledStartTime startTime')
      : null;
    const accessDate = session?.scheduledStartTime || session?.startTime || recording.createdAt || now;
    const subscription = await Subscription.findOne({
      userId, classId: recording.classId,
      $or: [
        { status: 'active' },
        { startDate: { $lte: accessDate }, endDate: { $gte: accessDate } },
      ],
    }).sort({ endDate: -1 });
    if (!subscription) return res.status(403).json({ code: 'subscription_required', message: 'You need an active paid period for this class' });
    if (subscription.accessCodeEmail && subscription.accessCodeEmail.toLowerCase() !== user.email.toLowerCase()) {
      return res.status(403).json({ code: 'access_code_email_mismatch', message: 'Your access code email does not match this account' });
    }
    if (subscription.accessCodeClassId && subscription.accessCodeClassId.toString() !== recording.classId.toString()) {
      return res.status(403).json({ code: 'access_code_mismatch', message: 'This access code belongs to another class' });
    }
    const coversSession = isWithinAccessWindow({
      date: accessDate,
      validFrom: subscription.startDate,
      validUntil: subscription.endDate,
    });
    const activeNow = subscription.status === 'active'
      && (!subscription.startDate || now >= subscription.startDate)
      && (!subscription.endDate || now <= subscription.endDate);
    if (!coversSession && !activeNow) {
      return res.status(403).json({ code: 'subscription_expired', message: 'Your paid access period has ended. Renew to keep watching' });
    }
    const accessCodeCoversSession = isWithinAccessWindow({
      date: accessDate,
      validFrom: subscription.accessCodeValidFrom,
      validUntil: subscription.accessCodeValidUntil,
    });
    if (!accessCodeCoversSession) {
      return res.status(403).json({ code: 'subscription_expired', message: 'Your paid access period has ended. Renew to keep watching' });
    }
    if (!recording.isVisible || (recording.releaseAt && recording.releaseAt > now)) return res.status(403).json({ code: 'recording_locked', message: 'This recording is not released yet' });
    const classData = await Class.findById(recording.classId).populate('hostId', 'suspendedAt bannedAt');
    if (classData?.hostId?.suspendedAt || classData?.hostId?.bannedAt) return res.status(403).json({ code: 'recording_unavailable', message: 'This recording is temporarily unavailable' });
    const deviceFingerprint = req.headers['x-device-fingerprint'] || generateTrustedDeviceFingerprint(req.headers['user-agent'], req.ip);
    if (!isTrustedDeviceAllowed({ trustedFingerprints: subscription.trustedDeviceFingerprints, providedFingerprint: deviceFingerprint, maxDevices: 3 })) {
      return res.status(403).json({ code: 'device_not_trusted', message: 'This device is not trusted for your access code' });
    }
    const registeredDevices = registerTrustedDevice({
      trustedFingerprints: subscription.trustedDeviceFingerprints,
      providedFingerprint: deviceFingerprint,
      maxDevices: 3,
    });
    if (registeredDevices.length !== (subscription.trustedDeviceFingerprints || []).length) {
      subscription.trustedDeviceFingerprints = registeredDevices;
      await subscription.save();
    }
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const streamUrl = await recordingProvider.createSignedPlaybackUrl(recording.streamUid, expiresAt);
    const progress = await PlaybackProgress.findOne({ userId, recordingId: recording._id });
    await PlaybackAnomaly.create({ userId, recordingId: recording._id, ipAddress: req.ip, deviceFingerprint });
    await Event.create({ userId, action: 'recording_opened', targetType: 'recording', targetId: recording._id, metadata: { classId: recording.classId, hostPlanTier: recording.hostPlanTier }, ip: req.ip, userAgent: req.headers['user-agent'] || '' }).catch(() => {});
    const positionSeed = crypto.createHash('sha256').update(`${recording._id}:${userId}:${expiresAt.toISOString()}`).digest('hex');
    return res.json({
      streamUrl, expiresAt,
      watermark: { name: `${user.firstName || ''} ${user.lastName || ''}`.trim(), studentName: `${user.firstName || ''} ${user.lastName || ''}`.trim(), email: user.email, overlayEnabled: true, positions: [positionSeed.slice(0, 2), positionSeed.slice(2, 4), positionSeed.slice(4, 6), positionSeed.slice(6, 8)], intervalSeconds: 60, sessionId: `${recording._id}:${userId}:${Date.now()}` },
      resumePosition: progress?.lastPosition || 0,
    });
  } catch (error) {
    return res.status(500).json({ code: 'recording_playback_failed', message: 'Unable to start playback right now' });
  }
};

export const updatePlaybackProgress = async (req, res) => {
  const { position = 0, percentWatched = 0 } = req.body;
  const progress = await PlaybackProgress.findOneAndUpdate(
    { userId: req.user.userId, recordingId: req.params.recordingId },
    { lastPosition: Math.max(0, Number(position)), percentWatched: Math.min(100, Math.max(0, Number(percentWatched))), updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await Event.create({ userId: req.user.userId, action: 'recording_watched', targetType: 'recording', targetId: req.params.recordingId, value: Number(position), metadata: { percentWatched: Number(percentWatched) }, ip: req.ip, userAgent: req.headers['user-agent'] || '' }).catch(() => {});
  res.json({ progress });
};

export const getStudentRecordingLibrary = async (req, res) => {
  const subscriptions = await Subscription.find({ userId: req.user.userId }).populate('classId', 'title').select('classId status startDate endDate');
  const classIds = subscriptions.map((subscription) => subscription.classId?._id).filter(Boolean);
  const recordings = await Recording.find({ classId: { $in: classIds }, hostPlanTier: { $in: [...PRO_TIERS] }, isDeleted: false })
    .populate('classId', 'title')
    .populate('hostId', 'firstName lastName name')
    .populate('sessionId', 'scheduledStartTime startTime')
    .sort({ createdAt: -1 });
  const progress = await PlaybackProgress.find({ userId: req.user.userId, recordingId: { $in: recordings.map((recording) => recording._id) } });
  const progressMap = new Map(progress.map((item) => [String(item.recordingId), item]));
  const subscriptionMap = new Map(subscriptions.map((subscription) => [String(subscription.classId._id), subscription]));
  const libraryIds = await RecordingLibrary.find({ userId: req.user.userId, recordingId: { $in: recordings.map((r) => r._id) } }).distinct('recordingId');
  const librarySet = new Set(libraryIds.map(String));
  res.json({ recordings: recordings.map((recording) => {
    const subscription = subscriptionMap.get(String(recording.classId?._id || recording.classId));
    const playable = recording.status === 'ready' && recording.isVisible && (!recording.releaseAt || recording.releaseAt <= new Date());
    const sessionDate = recording.sessionId?.scheduledStartTime || recording.sessionId?.startTime || recording.createdAt;
    const activeNow = subscription?.status === 'active'
      && (!subscription.startDate || subscription.startDate <= new Date())
      && (!subscription.endDate || subscription.endDate >= new Date());
    const coveredHistoricalPeriod = Boolean(subscription
      && (!subscription.startDate || subscription.startDate <= sessionDate)
      && (!subscription.endDate || subscription.endDate >= sessionDate));
    const covered = activeNow || coveredHistoricalPeriod;
    const isPlayable = playable && covered;
    const lockReason = recording.status === 'review_hold' ? 'review_hold' : (!covered ? 'subscription_expired' : (playable ? null : recording.status));
    return {
      ...safeRecording(recording, progressMap.get(String(recording._id)) || null),
      classTitle: recording.classId?.title,
      hostName: [recording.hostId?.firstName, recording.hostId?.lastName].filter(Boolean).join(' ') || recording.hostId?.name,
      createdAt: recording.createdAt,
      subscriptionStatus: subscription?.status,
      subscriptionCovered: covered,
      isPlayable,
      isLocked: !isPlayable,
      lockReason,
      lock: { isLocked: !isPlayable, reason: lockReason },
      libraryShared: librarySet.has(String(recording._id)),
    };
  }) });
};

export const updateClassRecordingSettings = async (req, res) => {
  if (!await assertRecordingFeature(req, res)) return;
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId }).populate('hostId', 'planTier');
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  if (!PRO_TIERS.has(classData.hostId.planTier)) return res.status(403).json({ message: 'Recordings unlock at Pro' });
  const { mode, releasePolicy, retentionDays, autoDeleteDays, watermarkOverlayEnabled } = req.body;
  if (mode && !['auto', 'manual'].includes(mode)) return res.status(400).json({ message: 'Invalid recording mode' });
  if (releasePolicy && releasePolicy !== '24h') return res.status(400).json({ message: 'Recordings always remain in review for 24 hours' });
  const configuredRetention = autoDeleteDays === undefined ? retentionDays : autoDeleteDays;
  if (configuredRetention !== undefined && ![30, 90, null].includes(configuredRetention)) return res.status(400).json({ message: 'Invalid retention period' });
  classData.recordingSettings = { ...classData.recordingSettings?.toObject?.(), mode, releasePolicy, retentionDays: configuredRetention, watermarkOverlayEnabled };
  await classData.save();
  res.json({ settings: classData.recordingSettings });
};

// ============================================
// Legacy Functions (Kept for backward compatibility)
// ============================================

export const startRecording = async (req, res) => {
  try {
    const { sessionId, classId } = req.body;
    if (!await assertRecordingFeature(req, res)) return;

    const { classData, error } = await requireProClass(classId);
    if (error || classData.hostId._id.toString() !== req.user.userId) {
      return res.status(error?.status || 403).json({ message: error?.message || 'Only the class owner can record sessions' });
    }
    if (classData.videoMode !== 'builtin') {
      return res.status(400).json({ message: 'External-link sessions use the upload recording fallback' });
    }
    const stream = await recordingProvider.createRecording();
    const retentionDays = classData.recordingSettings?.retentionDays;
    const recording = new Recording({
      sessionId,
      classId,
      hostId: req.user.userId,
      hostPlanTier: classData.hostId.activatedPlanTier || classData.hostId.planTier,
      streamUid: stream.streamUid,
      status: 'recording',
      title: `Recording - ${new Date().toISOString()}`,
      autoDeleteEnabled: Boolean(retentionDays),
      autoDeleteDays: retentionDays || null,
      autoDeleteAt: retentionDays ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000) : null,
    });

    await recording.save();

    res.status(201).json({
      message: 'Recording started',
      recording: safeRecording(recording),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeRecording = async (req, res) => {
  try {
    if (!await assertRecordingFeature(req, res)) return;
    const { recordingId, streamUid, duration, eventId: suppliedEventId, providerEventId } = req.body;
    const eventId = suppliedEventId || providerEventId;

    const existing = await Recording.findById(recordingId);
    if (!existing || existing.hostId.toString() !== req.user.userId) return res.status(404).json({ message: 'Recording not found' });
    if (eventId && existing.processedEventIds.includes(String(eventId))) {
      return res.json({ message: 'Recording event already processed', recording: safeRecording(existing), idempotent: true });
    }
    const classData = await Class.findById(existing.classId);
    const holdUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const retentionDays = classData?.recordingSettings?.retentionDays;
    const providerStreamUid = streamUid || existing.streamUid;
    if (providerStreamUid) await recordingProvider.completeRecording(providerStreamUid);
    const recording = await Recording.findByIdAndUpdate(
      recordingId,
      {
        status: holdUntil ? 'review_hold' : 'processing',
        streamUid: providerStreamUid,
        duration,
        autoDeleteEnabled: Boolean(retentionDays),
        autoDeleteDays: retentionDays || null,
        autoDeleteAt: retentionDays ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000) : null,
        reviewHoldUntil: holdUntil,
        releaseAt: holdUntil || new Date(),
        ...(eventId ? { $addToSet: { processedEventIds: String(eventId) } } : {}),
      },
      { new: true, ...(eventId ? {} : {}) }
    );
    // Trigger async AI processing
    const sourceUrl = providerStreamUid ? await recordingProvider.createSignedPlaybackUrl(providerStreamUid, new Date(Date.now() + 60 * 60 * 1000)) : null;
    if (sourceUrl) processRecordingAsync(recording._id, sourceUrl);

    res.json({
      message: 'Recording processing started',
      recording: safeRecording(recording),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await Recording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    res.json(safeRecording(recording));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecordingList = async (req, res) => {
  try {
    const { classId, skip = 0, limit = 20 } = req.query;

    const recordings = await Recording.find({ classId, status: 'ready', isVisible: true })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Recording.countDocuments({ classId, status: 'ready' });

    res.json({
      recordings: recordings.map((recording) => safeRecording(recording)),
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadRecording = async (req, res) => {
  if (!await assertRecordingFeature(req, res)) return;
  const { sessionId, classId } = req.body;
  const { classData, error } = await requireProClass(classId);
  if (error || classData.hostId._id.toString() !== req.user.userId) {
    return res.status(error?.status || 403).json({ message: error?.message || 'Only Pro hosts can upload recordings' });
  }
  if (!req.file) return res.status(400).json({ message: 'Choose a video file to upload' });
  if (Number(req.file.size) > 2 * 1024 * 1024 * 1024) {
    return res.status(413).json({ code: 'file_too_large', message: 'That file is too large — maximum 2 GB.' });
  }
  const retentionDays = classData.recordingSettings?.retentionDays;
  const holdUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const recording = await Recording.create({
    sessionId,
    classId,
    hostId: req.user.userId,
    hostPlanTier: classData.hostId.activatedPlanTier || classData.hostId.planTier,
    title: `Uploaded recording - ${new Date().toISOString()}`,
    storageUrl: req.file.path,
    fileSize: req.file.size,
    fileSizeBytes: req.file.size,
    status: holdUntil ? 'review_hold' : 'processing',
    isVisible: !holdUntil,
    reviewHoldUntil: holdUntil,
    releaseAt: holdUntil || new Date(),
    watermarkOverlayEnabled: classData.recordingSettings?.watermarkOverlayEnabled !== false,
    autoDeleteEnabled: Boolean(retentionDays),
    autoDeleteDays: retentionDays || null,
    autoDeleteAt: retentionDays ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000) : null,
  });
  return res.status(201).json({ recording: safeRecording(recording), message: 'Recording processing — usually ready within an hour' });
};

export const publishRecording = async (req, res) => {
  if (!await assertRecordingFeature(req, res)) return;
  const recording = await Recording.findOne({ _id: req.params.recordingId, hostId: req.user.userId });
  if (!recording) return res.status(404).json({ message: 'Recording not found' });
  if (recording.reviewHoldUntil && recording.reviewHoldUntil > new Date()) {
    return res.status(409).json({
      code: 'recording_review_hold',
      message: 'This recording remains unavailable until the 24-hour review hold ends.',
    });
  }
  recording.isVisible = true;
  recording.releaseAt = new Date();
  recording.reviewHoldUntil = null;
  recording.status = 'ready';
  recording.processingProgress = 100;
  await recording.save();
  await fanOutRecordingToActiveStudents(recording);
  res.json({ recording: safeRecording(recording) });
};

export const getHostRecordings = async (req, res) => {
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId }).populate('hostId', 'planTier');
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  if (!PRO_TIERS.has(classData.hostId.planTier)) return res.status(403).json({ message: 'Recordings unlock at Pro' });
  const recordings = await Recording.find({ classId: classData._id, isDeleted: false }).sort({ createdAt: -1 });
  res.json({ recordings: recordings.map((recording) => safeRecording(recording)) });
};

export const setRecordingVisibility = async (req, res) => {
  if (!await assertRecordingFeature(req, res)) return;
  const recording = await Recording.findOne({ _id: req.params.recordingId, hostId: req.user.userId });
  if (!recording) return res.status(404).json({ message: 'Recording not found' });
  recording.isVisible = Boolean(req.body.visible);
  if (recording.isVisible && (!recording.releaseAt || recording.releaseAt > new Date())) recording.releaseAt = new Date();
  await recording.save();
  res.json({ recording: safeRecording(recording) });
};

export const getRecordingStats = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await Recording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    const stats = {
      duration: recording.duration,
      fileSize: recording.fileSize,
      transcriptLength: recording.transcript?.length || 0,
      chaptersCount: recording.chapters?.length || 0,
      keyTakeawaysCount: recording.keyTakeaways?.length || 0,
      languages: recording.detectedLanguages || [],
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Async processing function (runs in background)
async function processRecordingAsync(recordingId, videoUrl) {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const recording = await Recording.findById(recordingId);
      if (!recording) return;
      const host = await User.findById(recording.hostId);
      const today = new Date().toISOString().slice(0, 10);
      const cap = Number(process.env.RECORDING_TRANSCRIPTION_DAILY_MINUTES || 120);
      const minutes = Math.ceil((recording.durationSeconds || recording.duration || 0) / 60);
      const used = host?.recordingTranscriptionUsage?.date === today ? host.recordingTranscriptionUsage.minutes || 0 : 0;
      if (used + minutes > cap) {
        console.warn(`[recordings] transcription cap reached for host ${recording.hostId}; skipping enrichment`);
        const holdActive = recording.reviewHoldUntil && recording.reviewHoldUntil > new Date();
        recording.status = holdActive ? 'review_hold' : 'ready';
        recording.isVisible = !holdActive;
        recording.releaseAt = holdActive ? recording.reviewHoldUntil : (recording.releaseAt || new Date());
        recording.processingProgress = 100;
        await recording.save();
        if (!holdActive) await fanOutRecordingToActiveStudents(recording);
        return;
      }
      if (host) {
        host.recordingTranscriptionUsage = { date: today, minutes: used + minutes };
        await host.save();
      }
      const transcript = await transcribeAudio(videoUrl);
      recording.transcript = transcript;
      recording.aiSummary = await summarizeContent(transcript);
      recording.summary = recording.aiSummary;
      recording.aiTimestamps = await generateChapters(transcript);
      recording.chapters = recording.aiTimestamps;
      recording.aiKeyTakeaways = extractKeyTakeaways(recording.aiSummary);
      recording.keyTakeaways = recording.aiKeyTakeaways;
      recording.aiModel = process.env.OPENAI_MODEL || 'provider-default';
      recording.aiPromptVersion = 'recordings-v1';
      const holdActive = recording.reviewHoldUntil && recording.reviewHoldUntil > new Date();
      recording.status = holdActive ? 'review_hold' : 'ready';
      recording.isVisible = !holdActive;
      recording.releaseAt = holdActive ? recording.reviewHoldUntil : (recording.releaseAt || new Date());
      recording.processingProgress = 100;
      await recording.save();
      if (!holdActive) {
        await fanOutRecordingToActiveStudents(recording);
      }
      return;
    } catch (error) {
      const recording = await Recording.findById(recordingId);
      if (!recording) return;
      recording.retryCount = attempt;
      recording.processingError = error.message;
      if (attempt === maxRetries) {
        recording.status = 'failed';
        await recording.save();
        console.error(`[recordings] processing failed after ${maxRetries} attempts`, error);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 100));
    }
  }
}

function extractKeyTakeaways(summary) {
  // Simple extraction of key points from summary
  return summary
    .split('.')
    .filter(s => s.trim().length > 20)
    .slice(0, 5);
}
