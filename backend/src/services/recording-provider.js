import crypto from 'crypto';
import axios from 'axios';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';

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
    const streamUid = `dev-${recordingId || crypto.randomUUID()}`;
    return { streamUid, providerRecordingId: streamUid };
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

function agoraBasicAuth() {
  return Buffer.from(`${process.env.AGORA_CUSTOMER_ID}:${process.env.AGORA_CUSTOMER_SECRET}`).toString('base64');
}

function agoraHeaders() {
  return {
    Authorization: `Basic ${agoraBasicAuth()}`,
    'Content-Type': 'application/json',
  };
}

function recordingDescriptor(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

export class AgoraCloudRecordingProvider {
  constructor() {
    this.baseUrl = process.env.AGORA_RECORDING_API_URL || 'https://api.agora.io/v1/apps';
  }

  assertConfigured() {
    const required = ['VIDEO_APP_ID', 'AGORA_CUSTOMER_ID', 'AGORA_CUSTOMER_SECRET', 'RECORDING_STORAGE_BUCKET', 'RECORDING_STORAGE_ACCESS_KEY', 'RECORDING_STORAGE_SECRET'];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length) throw new Error('Recording is not available yet. Please contact the class host.');
  }

  async request(method, path, data) {
    this.assertConfigured();
    try {
      const response = await axios({ method, url: `${this.baseUrl}/${process.env.VIDEO_APP_ID}${path}`, headers: agoraHeaders(), data, timeout: 20000 });
      return response.data;
    } catch (error) {
      error.message = 'The recording service is temporarily unavailable. Please try again.';
      throw error;
    }
  }

  async createRecording({ sessionId }) {
    const channelName = String(sessionId);
    const uid = String(process.env.AGORA_RECORDING_UID || '999999');
    const acquired = await this.request('post', '/cloud_recording/acquire', {
      cname: channelName,
      uid,
      clientRequest: { resourceExpiredHour: 24 },
    });
    const resourceId = acquired.resourceId;
    const recordingToken = process.env.AGORA_RECORDING_TOKEN
      || RtcTokenBuilder.buildTokenWithUid(
        process.env.VIDEO_APP_ID,
        process.env.VIDEO_APP_SECRET,
        channelName,
        Number(uid),
        RtcRole.PUBLISHER,
        Math.floor(Date.now() / 1000) + 24 * 60 * 60
      );
    const started = await this.request('post', `/cloud_recording/resourceid/${encodeURIComponent(resourceId)}/mode/mix/start`, {
      cname: channelName,
      uid,
      clientRequest: {
        token: recordingToken,
        recordingConfig: {
          channelType: 0,
          streamTypes: 2,
          audioProfile: 1,
          videoStreamType: 0,
          maxIdleTime: 30,
        },
        storageConfig: {
          vendor: 1,
          region: Number(process.env.RECORDING_STORAGE_REGION_CODE || 0),
          bucket: process.env.RECORDING_STORAGE_BUCKET,
          accessKey: process.env.RECORDING_STORAGE_ACCESS_KEY,
          secretKey: process.env.RECORDING_STORAGE_SECRET,
          fileNamePrefix: [process.env.RECORDING_STORAGE_PREFIX || 'edutalk'],
        },
      },
    });
    const descriptor = { resourceId, sid: started.sid, channelName, uid };
    return {
      streamUid: Buffer.from(JSON.stringify(descriptor)).toString('base64url'),
      providerRecordingId: started.sid,
      providerResourceId: resourceId,
      providerSid: started.sid,
    };
  }

  async completeRecording(streamUid) {
    const descriptor = recordingDescriptor(streamUid);
    if (!descriptor) throw new Error('The recording session could not be found. Please try again.');
    const result = await this.request('post', `/cloud_recording/resourceid/${encodeURIComponent(descriptor.resourceId)}/sid/${encodeURIComponent(descriptor.sid)}/mode/mix/stop`, {
      cname: descriptor.channelName,
      uid: descriptor.uid,
      clientRequest: {},
    });
    let file = result.serverResponse?.fileList?.find((item) => item.fileName?.endsWith('.mp4'))
      || result.fileList?.find((item) => item.fileName?.endsWith('.mp4'));
    if (!file) {
      for (let attempt = 0; attempt < 5 && !file; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const queried = await this.request('get', `/cloud_recording/resourceid/${encodeURIComponent(descriptor.resourceId)}/sid/${encodeURIComponent(descriptor.sid)}/mode/mix/query`);
        file = queried.serverResponse?.fileList?.find((item) => item.fileName?.endsWith('.mp4'))
          || queried.fileList?.find((item) => item.fileName?.endsWith('.mp4'));
      }
    }
    const completed = { ...descriptor, fileName: file?.fileName || null };
    return {
      status: file ? 'ready_for_processing' : 'processing',
      streamUid: Buffer.from(JSON.stringify(completed)).toString('base64url'),
      providerRecordingId: descriptor.sid,
      providerResourceId: descriptor.resourceId,
      providerSid: descriptor.sid,
      providerFileName: file?.fileName || null,
    };
  }

  async createSignedPlaybackUrl(streamUid, expiresAt) {
    const descriptor = recordingDescriptor(streamUid);
    if (!descriptor?.fileName) throw new Error('Recording file is still processing');
    const client = new S3Client({
      region: process.env.RECORDING_STORAGE_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.RECORDING_STORAGE_ACCESS_KEY,
        secretAccessKey: process.env.RECORDING_STORAGE_SECRET,
      },
    });
    return getSignedUrl(client, new GetObjectCommand({
      Bucket: process.env.RECORDING_STORAGE_BUCKET,
      Key: descriptor.fileName,
      ResponseContentType: 'video/mp4',
      ResponseContentDisposition: 'inline',
    }), { expiresIn: Math.max(60, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)) });
  }

  async deleteRecording(streamUid) {
    const descriptor = recordingDescriptor(streamUid);
    if (!descriptor) return { deleted: true };
    if (descriptor.fileName) {
      const client = new S3Client({
        region: process.env.RECORDING_STORAGE_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.RECORDING_STORAGE_ACCESS_KEY,
          secretAccessKey: process.env.RECORDING_STORAGE_SECRET,
        },
      });
      await client.send(new DeleteObjectCommand({
        Bucket: process.env.RECORDING_STORAGE_BUCKET,
        Key: descriptor.fileName,
      }));
    }
    return { deleted: true, providerRecordingId: descriptor.sid };
  }

  async healthCheck() {
    this.assertConfigured();
    return { provider: 'agora-cloud-recording', status: 'configured', checkedAt: new Date().toISOString() };
  }
}

export const recordingProvider = process.env.VIDEO_RECORDING_PROVIDER === 'agora'
  ? new AgoraCloudRecordingProvider()
  : new DevMockProvider();
