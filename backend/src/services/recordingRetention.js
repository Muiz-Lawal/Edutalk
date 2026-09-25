import fs from 'fs/promises';
import Recording from '../models/Recording.js';
import { recordingProvider } from './recording-provider.js';
import { fanOutRecordingToActiveStudents } from './recordingLibrary.js';

const lifecycleState = {
  lastStartedAt: null,
  lastCompletedAt: null,
  lastResult: null,
  lastError: null,
};

export const getRecordingLifecycleStatus = () => ({ ...lifecycleState });

export const isReviewHoldDue = (recording, now = new Date()) =>
  recording.status === 'review_hold'
  && recording.reviewHoldUntil
  && new Date(recording.reviewHoldUntil) <= now;

export const isRetentionDue = (recording, now = new Date()) =>
  recording.autoDeleteAt
  && new Date(recording.autoDeleteAt) <= now
  && recording.status !== 'expired';

export async function releaseDueRecordingHolds(now = new Date()) {
  const due = await Recording.find({
    status: 'review_hold',
    reviewHoldUntil: { $lte: now },
    isDeleted: { $ne: true },
  });
  let released = 0;
  for (const recording of due) {
    if (recording.status !== 'review_hold') continue;
    recording.status = 'ready';
    recording.isVisible = true;
    recording.processingProgress = 100;
    recording.releaseAt = recording.releaseAt && recording.releaseAt > now ? recording.releaseAt : now;
    recording.reviewHoldUntil = null;
    await recording.save();
    await fanOutRecordingToActiveStudents(recording);
    released += 1;
  }
  return released;
}

export async function purgeExpiredRecordings(now = new Date()) {
  const expired = await Recording.find({
    autoDeleteAt: { $lte: now },
    status: { $ne: 'expired' },
    isDeleted: { $ne: true },
  });
  let deleted = 0;
  for (const recording of expired) {
    await recordingProvider.deleteRecording(recording.streamUid);
    if (recording.storageUrl && !/^https?:\/\//.test(recording.storageUrl)) {
      await fs.rm(recording.storageUrl, { force: true });
    }
    await Recording.deleteOne({ _id: recording._id });
    console.info(`[recordings] deleted expired recording ${recording._id}`);
    deleted += 1;
  }
  return deleted;
}

export async function runRecordingLifecycle(now = new Date()) {
  lifecycleState.lastStartedAt = new Date();
  lifecycleState.lastError = null;
  try {
    const released = await releaseDueRecordingHolds(now);
    const deleted = await purgeExpiredRecordings(now);
    lifecycleState.lastResult = { released, deleted };
    lifecycleState.lastCompletedAt = new Date();
    return lifecycleState.lastResult;
  } catch (error) {
    lifecycleState.lastError = 'Recording lifecycle job failed';
    throw error;
  }
}
