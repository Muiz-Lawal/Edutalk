import Recording from '../models/Recording.js';
import RecordingLibrary from '../models/RecordingLibrary.js';
import Subscription from '../models/Subscription.js';

// Fan-out is deliberately upsert-based: retries from payment webhooks and
// enrollment flows cannot create duplicate library entries.
export const fanOutRecordingToActiveStudents = async (recording) => {
  if (!recording || recording.hostPlanTier !== 'elite') return { inserted: 0 };
  const subscriptions = await Subscription.find({
    classId: recording.classId,
    status: 'active',
  }).select('userId');
  if (!subscriptions.length) return { inserted: 0 };
  const operations = subscriptions.map(({ userId }) => ({
    updateOne: {
      filter: { recordingId: recording._id, userId },
      update: { $setOnInsert: { recordingId: recording._id, userId, classId: recording.classId } },
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
