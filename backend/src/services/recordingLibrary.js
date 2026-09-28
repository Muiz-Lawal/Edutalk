import Recording from '../models/Recording.js';
import RecordingLibrary from '../models/RecordingLibrary.js';
import Subscription from '../models/Subscription.js';
import Class from '../models/Class.js';
import { dispatch } from '../lib/notifications.js';

// Fan-out is deliberately upsert-based: retries from payment webhooks and
// enrollment flows cannot create duplicate library entries.
export const fanOutRecordingToActiveStudents = async (recording) => {
  if (!recording) return { inserted: 0 };
  const subscriptions = await Subscription.find({
    classId: recording.classId,
    status: 'active',
  }).populate('userId', 'email firstName timezone');
  if (['pro', 'elite'].includes(recording.hostPlanTier)) {
    const classData = await Class.findById(recording.classId).select('title timezone');
    await Promise.all(subscriptions.filter(({ userId }) => userId?.email).map(({ userId }) => dispatch(
      userId,
      'recording_ready',
      {
        entityId: String(recording._id),
        classId: String(recording.classId),
        classTitle: classData?.title || recording.title,
        sessionDate: recording.startedAt || recording.stoppedAt || new Date(),
        timezone: userId.timezone || classData?.timezone || 'UTC',
      },
    )));
  }
  if (recording.hostPlanTier !== 'elite' || !subscriptions.length) return { inserted: 0 };
  if (!subscriptions.length) return { inserted: 0 };
  const operations = subscriptions.map(({ userId }) => ({
    updateOne: {
      filter: { recordingId: recording._id, userId: userId._id || userId },
      update: { $setOnInsert: { recordingId: recording._id, userId: userId._id || userId, classId: recording.classId } },
      upsert: true,
    },
  }));
  const result = await RecordingLibrary.bulkWrite(operations, { ordered: false });
  return { inserted: result.upsertedCount || 0 };
};

export const backfillStudentRecordingLibrary = async ({ userId, classId }) => {
  const recordings = await Recording.find({
    classId,
    hostPlanTier: 'elite',
    isDeleted: false,
  }).select('_id classId hostPlanTier');
  if (!recordings.length) return { inserted: 0 };
  const result = await RecordingLibrary.bulkWrite(recordings.map((recording) => ({
    updateOne: {
      filter: { recordingId: recording._id, userId },
      update: { $setOnInsert: { recordingId: recording._id, userId, classId } },
      upsert: true,
    },
  })), { ordered: false });
  return { inserted: result.upsertedCount || 0 };
};
