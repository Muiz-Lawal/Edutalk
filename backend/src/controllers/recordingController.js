import Recording from '../models/Recording.js';
import crypto from 'crypto';
import WatchHistory from '../models/WatchHistory.js';
import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import PlaybackProgress from '../models/PlaybackProgress.js';
import PlaybackAnomaly from '../models/PlaybackAnomaly.js';
import { isTrustedDeviceAllowed, generateTrustedDeviceFingerprint } from '../utils/accessCode.js';
import { recordingProvider } from '../services/recording-provider.js';
import { transcribeAudio, summarizeContent, generateChapters } from '../utils/ai.js';
import { assertFeature, planGateResponse } from '../utils/plan-limits.js';

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
  transcript: recording.transcript,
  transcriptSegments: recording.transcriptSegments || [],
  aiSummary: recording.aiSummary || recording.summary,
  aiTimestamps: recording.aiTimestamps || recording.chapters || [],
  aiKeyTakeaways: recording.aiKeyTakeaways || recording.keyTakeaways || [],
  watermarkOverlayEnabled: recording.watermarkOverlayEnabled !== false,
  progress,
});

const requireProClass = async (classId) => {
  const classData = await Class.findById(classId).populate('hostId', 'planTier suspendedAt bannedAt');
  if (!classData) return { error: { status: 404, message: 'Class not found' } };
  if (!PRO_TIERS.has(classData.hostId?.planTier)) return { error: { status: 404, message: 'Recording not found' } };
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
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: 'Log in to watch this recording' });
  const user = await User.findById(userId).select('email emailPreferences hostVerified planTier suspendedAt bannedAt');
  if (!user) return res.status(401).json({ message: 'Log in to watch this recording' });
  if (!user.emailPreferences?.emailVerified) return res.status(403).json({ message: 'Verify your email before watching recordings' });

  const recording = await Recording.findById(req.params.recordingId);
  if (!recording || recording.status !== 'ready') return res.status(404).json({ message: 'Recording not found' });
  const subscription = await Subscription.findOne({ userId, classId: recording.classId, status: 'active' });
  if (!subscription) {
    const expired = await Subscription.findOne({ userId, classId: recording.classId, status: 'expired' });
    return res.status(403).json({ message: expired ? 'Renew to keep watching' : 'You need an active access code for this class' });
  }
  if (!subscription.accessCode || subscription.accessCodeClassId?.toString() !== recording.classId.toString()) {
    return res.status(403).json({ message: 'You need an active access code for this class' });
  }
  const { classData, error } = await requireProClass(recording.classId);
  if (error) return res.status(error.status).json({ message: error.message });
  const now = new Date();
  if (subscription.accessCodeEmail?.toLowerCase() !== user.email.toLowerCase()) {
    return res.status(403).json({ message: 'Your access code email does not match this account' });
  }
  const deviceFingerprint = req.headers['x-device-fingerprint'] || generateTrustedDeviceFingerprint(req.headers['user-agent'], req.ip);
  if (!isTrustedDeviceAllowed({ trustedFingerprints: subscription.trustedDeviceFingerprints, providedFingerprint: deviceFingerprint, maxDevices: 3 })) {
    return res.status(403).json({ message: 'This device is not trusted for your access code' });
  }
  if (now < subscription.accessCodeValidFrom || now > subscription.accessCodeValidUntil || now < subscription.startDate || now > subscription.endDate) {
    return res.status(403).json({ message: 'Renew to keep watching' });
  }
  if (!recording.isVisible || (recording.releaseAt && recording.releaseAt > now)) {
    return res.status(403).json({ message: 'This recording is not released yet' });
  }
  if (classData.hostId?.suspendedAt || classData.hostId?.bannedAt) return res.status(403).json({ message: 'This recording is temporarily unavailable' });

  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
  const streamUrl = await recordingProvider.createSignedPlaybackUrl(recording.streamUid, expiresAt);
  const progress = await PlaybackProgress.findOne({ userId, recordingId: recording._id });
  await PlaybackAnomaly.create({ userId, recordingId: recording._id, ipAddress: req.ip, deviceFingerprint });
  const positionSeed = crypto.createHash('sha256').update(`${recording._id}:${userId}:${expiresAt.toISOString()}`).digest('hex');
  return res.json({
    streamUrl,
    expiresAt,
    watermark: { email: user.email, overlayEnabled: recording.watermarkOverlayEnabled !== false, positions: [positionSeed.slice(0, 2), positionSeed.slice(2, 4), positionSeed.slice(4, 6), positionSeed.slice(6, 8)], intervalSeconds: 20, sessionId: `${recording._id}:${userId}:${Date.now()}` },
    resumePosition: progress?.lastPosition || 0,
  });
};

export const updatePlaybackProgress = async (req, res) => {
  const { position = 0, percentWatched = 0 } = req.body;
  const progress = await PlaybackProgress.findOneAndUpdate(
    { userId: req.user.userId, recordingId: req.params.recordingId },
    { lastPosition: Math.max(0, Number(position)), percentWatched: Math.min(100, Math.max(0, Number(percentWatched))), updatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  res.json({ progress });
};

export const getStudentRecordingLibrary = async (req, res) => {
  const subscriptions = await Subscription.find({ userId: req.user.userId }).populate({ path: 'classId', populate: { path: 'hostId', select: 'planTier' } }).select('classId status');
  const eligibleSubscriptions = subscriptions.filter((subscription) => PRO_TIERS.has(subscription.classId?.hostId?.planTier));
  const classIds = eligibleSubscriptions.map((subscription) => subscription.classId._id);
  const recordings = await Recording.find({ classId: { $in: classIds }, isDeleted: false }).populate('classId', 'title').sort({ createdAt: -1 });
  const progress = await PlaybackProgress.find({ userId: req.user.userId, recordingId: { $in: recordings.map((recording) => recording._id) } });
  const progressMap = new Map(progress.map((item) => [String(item.recordingId), item]));
  const statusMap = new Map(eligibleSubscriptions.map((subscription) => [String(subscription.classId._id), subscription.status]));
  res.json({ recordings: recordings.map((recording) => ({ ...safeRecording(recording, progressMap.get(String(recording._id)) || null), classTitle: recording.classId?.title, subscriptionStatus: statusMap.get(String(recording.classId?._id || recording.classId)) })) });
};

export const updateClassRecordingSettings = async (req, res) => {
  try {
    await assertFeature(req.user.userId, 'recording');
  } catch (error) {
    if (planGateResponse(error, res)) return;
    return res.status(500).json({ message: 'Unable to update recording settings.' });
  }
  const classData = await Class.findOne({ _id: req.params.classId, hostId: req.user.userId }).populate('hostId', 'planTier');
  if (!classData) return res.status(404).json({ message: 'Class not found' });
  if (!PRO_TIERS.has(classData.hostId.planTier)) return res.status(403).json({ message: 'Recordings unlock at Pro' });
  const { mode, releasePolicy, retentionDays, watermarkOverlayEnabled } = req.body;
  if (mode && !['auto', 'manual'].includes(mode)) return res.status(400).json({ message: 'Invalid recording mode' });
  if (releasePolicy && !['immediate', '24h'].includes(releasePolicy)) return res.status(400).json({ message: 'Invalid release policy' });
  if (retentionDays !== undefined && ![30, 90, null].includes(retentionDays)) return res.status(400).json({ message: 'Invalid retention period' });
  classData.recordingSettings = { ...classData.recordingSettings?.toObject?.(), mode, releasePolicy, retentionDays, watermarkOverlayEnabled };
  await classData.save();
  res.json({ settings: classData.recordingSettings });
};

// ============================================
// Legacy Functions (Kept for backward compatibility)
// ============================================

export const startRecording = async (req, res) => {
  try {
    const { sessionId, classId } = req.body;
    try {
      await assertFeature(req.user.userId, 'recording');
    } catch (error) {
      if (planGateResponse(error, res)) return;
      return res.status(500).json({ message: 'Unable to start recording.' });
    }

    const { classData, error } = await requireProClass(classId);
    if (error || classData.hostId._id.toString() !== req.user.userId) {
      return res.status(error?.status || 403).json({ message: error?.message || 'Only the class owner can record sessions' });
    }
    if (classData.videoMode !== 'builtin') {
      return res.status(400).json({ message: 'External-link sessions use the upload recording fallback' });
    }
    const recording = new Recording({
      sessionId,
      classId,
      hostId: req.user.userId,
      status: 'recording',
      title: `Recording - ${new Date().toISOString()}`,
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
    const { recordingId, streamUid, duration } = req.body;

    const existing = await Recording.findById(recordingId);
    if (!existing || existing.hostId.toString() !== req.user.userId) return res.status(404).json({ message: 'Recording not found' });
    const recording = await Recording.findByIdAndUpdate(
      recordingId,
      {
        status: 'processing',
        streamUid,
        duration,
      },
      { new: true }
    );

    // Trigger async AI processing
    const sourceUrl = streamUid ? await recordingProvider.createSignedPlaybackUrl(streamUid, new Date(Date.now() + 60 * 60 * 1000)) : null;
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
  try {
    await assertFeature(req.user.userId, 'recording');
  } catch (error) {
    if (planGateResponse(error, res)) return;
    return res.status(500).json({ message: 'Unable to upload recording.' });
  }
  const { sessionId, classId } = req.body;
  const { classData, error } = await requireProClass(classId);
  if (error || classData.hostId._id.toString() !== req.user.userId) {
    return res.status(error?.status || 403).json({ message: error?.message || 'Only Pro hosts can upload recordings' });
  }
  if (!req.file) return res.status(400).json({ message: 'Choose a video file to upload' });
  const retentionDays = classData.recordingSettings?.retentionDays;
  const releasePolicy = classData.recordingSettings?.releasePolicy || 'immediate';
  const recording = await Recording.create({
    sessionId,
    classId,
    hostId: req.user.userId,
    title: `Uploaded recording - ${new Date().toISOString()}`,
    storageUrl: req.file.path,
    fileSize: req.file.size,
    fileSizeBytes: req.file.size,
    status: 'processing',
    isVisible: releasePolicy === 'immediate',
    releaseAt: releasePolicy === '24h' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : new Date(),
    watermarkOverlayEnabled: classData.recordingSettings?.watermarkOverlayEnabled !== false,
    autoDeleteAt: retentionDays ? new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000) : null,
  });
  return res.status(201).json({ recording: safeRecording(recording), message: 'Recording processing — usually ready within an hour' });
};

export const publishRecording = async (req, res) => {
  const recording = await Recording.findOne({ _id: req.params.recordingId, hostId: req.user.userId });
  if (!recording) return res.status(404).json({ message: 'Recording not found' });
  recording.isVisible = true;
  recording.releaseAt = new Date();
  await recording.save();
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
        recording.status = 'ready';
        recording.processingProgress = 100;
        await recording.save();
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
      recording.status = 'ready';
      recording.processingProgress = 100;
      await recording.save();
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
