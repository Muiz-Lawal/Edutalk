import crypto from 'crypto';

const providerBaseUrl = process.env.RECORDING_PROVIDER_BASE_URL || 'https://videodelivery.net';

export const recordingProvider = {
  async createSignedPlaybackUrl(streamUid, expiresAt) {
    if (!streamUid) throw new Error('Recording provider stream is not ready');
    const expires = Math.floor(new Date(expiresAt).getTime() / 1000);
    const secret = process.env.RECORDING_SIGNING_SECRET || process.env.JWT_SECRET || 'development-recording-secret';
    const signature = crypto.createHmac('sha256', secret).update(`${streamUid}:${expires}`).digest('hex');
    return `${providerBaseUrl}/${encodeURIComponent(streamUid)}/manifest/video.m3u8?expires=${expires}&sig=${signature}`;
  },
  async deleteRecording(streamUid) {
    if (!streamUid) return;
    // Provider deletion is intentionally server-side; production adapters replace this method.
    return { streamUid, deleted: true };
  },
};
