import fs from 'fs/promises';
import Recording from '../models/Recording.js';
import { recordingProvider } from './recording-provider.js';

export async function purgeExpiredRecordings(now = new Date()) {
  const expired = await Recording.find({ autoDeleteAt: { $lte: now }, status: { $ne: 'expired' } });
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
