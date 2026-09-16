import crypto from 'crypto';

const providerBaseUrl = process.env.RECORDING_PROVIDER_BASE_URL || 'https://videodelivery.net';

/**
 * Local provider used in development and tests.  The provider deliberately
 * has no network or storage dependency; production deployments can replace it
 * behind the same small interface.
 */
export class DevMockProvider {
  constructor() {
    this.deleted = new Set();
  }

  async createRecording({ recordingId } = {}) {
    return { streamUid: `dev-${recordingId || crypto.randomUUID()}` };
  }

  async completeRecording(streamUid) {
    return { streamUid, status: 'processing' };
  }

  async createSignedPlaybackUrl(streamUid, expiresAt) {
    if (!streamUid || this.deleted.has(streamUid)) throw new Error('Recording provider stream is not ready');
    const expires = Math.floor(new Date(expiresAt).getTime() / 1000);
    const secret = process.env.RECORDING_SIGNING_SECRET || process.env.JWT_SECRET || 'development-recording-secret';
    const signature = crypto.createHmac('sha256', secret).update(`${streamUid}:${expires}`).digest('hex');
    return `${providerBaseUrl}/${encodeURIComponent(streamUid)}/manifest/video.m3u8?expires=${expires}&sig=${signature}`;
  }

  async deleteRecording(streamUid) {
    if (streamUid) this.deleted.add(streamUid);
    return { streamUid, deleted: true };
  }

  async healthCheck() {
    return {
      provider: 'dev-mock',
      status: 'healthy',
      checkedAt: new Date().toISOString(),
    };
  }
}

export const recordingProvider = new DevMockProvider();
