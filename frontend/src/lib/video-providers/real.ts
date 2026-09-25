import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, IAgoraRTCRemoteUser, ILocalAudioTrack, ILocalVideoTrack } from 'agora-rtc-sdk-ng';
import type { ProviderConnection, ProviderParticipant, VideoProvider } from '../video-provider';
// @ts-ignore Shared JavaScript API client.
import api from '../../utils/api.js';

type ProviderError = Error & { code?: string; status?: number };

const apiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const authHeaders = (token: string | null) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

async function request(url: string, options: RequestInit) {
  try {
    const response = await api.request({
      url: url.replace(apiUrl(), ''),
      method: options.method || 'GET',
      data: options.body ? JSON.parse(String(options.body)) : undefined,
    });
    return { ok: true, status: response.status, json: async () => response.data };
  } catch (error) {
    return { ok: false, status: (error as { status?: number }).status || 500, json: async () => ({}) };
  }
}

function asProviderError(message: string, response: { status: number }, details: { code?: string; message?: string }) {
  const error = new Error(details.message || message) as ProviderError;
  error.code = details.code;
  error.status = response.status;
  return error;
}

function qualityForNetwork(quality?: number): ProviderParticipant['quality'] {
  if (!quality || quality <= 2) return 'good';
  if (quality <= 4) return 'fair';
  return 'poor';
}

function participantFromRemote(user: IAgoraRTCRemoteUser): ProviderParticipant {
  return {
    id: String(user.uid),
    name: `Participant ${user.uid}`,
    audioEnabled: Boolean(user.hasAudio),
    videoEnabled: Boolean(user.hasVideo),
    quality: 'good',
    audioTrack: user.audioTrack,
    videoTrack: user.videoTrack,
  };
}

export class RealVideoProvider implements VideoProvider {
  async createRoom(sessionId: string) {
    const token = localStorage.getItem('token');
    const response = await request(`${apiUrl()}/video/rooms`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ sessionId }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw asProviderError('Room creation failed', response, payload);

    const created = payload.videoRoom || payload;
    sessionStorage.setItem(`video-session-${created.roomId}`, sessionId);
    return {
      roomId: created.roomId,
      joinUrlHost: `/session/${sessionId}?role=host`,
      joinUrlStudent: `/session/${sessionId}`,
    };
  }

  getUserMedia(constraints: MediaStreamConstraints) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  async createConnection({
    roomId,
    token,
    onStateChange,
    onParticipants,
    onBreakoutAssignment,
  }: Parameters<VideoProvider['createConnection']>[0]) {
    const authToken = token || localStorage.getItem('token');
    const sessionId = sessionStorage.getItem(`video-session-${roomId}`) || roomId;
    const role = new URLSearchParams(window.location.search).get('role') === 'host' ? 'host' : 'student';
    let channel = sessionId;
    let uid = '';
    let client: IAgoraRTCClient | null = null;
    let audioTrack: ILocalAudioTrack | null = null;
    let videoTrack: ILocalVideoTrack | null = null;
    let screenTrack: ILocalVideoTrack | null = null;
    let screenAudioTrack: ILocalAudioTrack | null = null;
    let active = true;
    let activeBreakoutRoomId: string | null = null;
    let reconnectPromise: Promise<void> | null = null;
    let reconnectAttempts = 0;
    const remoteUsers = new Map<string, ProviderParticipant>();

    const requestToken = async (breakoutRoomId?: string | null) => {
      const response = await request(`${apiUrl()}/video/token`, {
        method: 'POST',
        headers: authHeaders(authToken),
        body: JSON.stringify({ roomId, sessionId, role, breakoutRoomId: breakoutRoomId || undefined }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw asProviderError('Video token request failed', response, payload);
      if (!payload.token || !payload.channel) throw new Error('Video provider is not configured.');
      return payload;
    };

    const publishLocalTracks = async () => {
      if (!client) return;
      const tracks = [audioTrack, videoTrack].filter(Boolean) as Array<ILocalAudioTrack | ILocalVideoTrack>;
      if (tracks.length) await client.publish(tracks);
    };

    const emitParticipants = () => onParticipants(Array.from(remoteUsers.values()));

    const bindClientEvents = () => {
      if (!client) return;
      client.on('user-published', async (user, mediaType) => {
        if (!client) return;
        await client.subscribe(user, mediaType);
        const participant = remoteUsers.get(String(user.uid)) || participantFromRemote(user);
        if (mediaType === 'audio') participant.audioTrack = user.audioTrack;
        if (mediaType === 'video') participant.videoTrack = user.videoTrack;
        participant.audioEnabled = Boolean(user.hasAudio);
        participant.videoEnabled = Boolean(user.hasVideo);
        remoteUsers.set(String(user.uid), participant);
        if (mediaType === 'audio') user.audioTrack?.play();
        emitParticipants();
      });
      client.on('user-unpublished', (user, mediaType) => {
        const participant = remoteUsers.get(String(user.uid));
        if (!participant) return;
        if (mediaType === 'audio') {
          participant.audioTrack?.stop?.();
          participant.audioTrack = undefined;
          participant.audioEnabled = false;
        } else {
          participant.videoTrack?.stop?.();
          participant.videoTrack = undefined;
          participant.videoEnabled = false;
        }
        remoteUsers.set(String(user.uid), participant);
        emitParticipants();
      });
      client.on('user-left', (user) => {
        remoteUsers.delete(String(user.uid));
        emitParticipants();
      });
      client.on('volume-indicator', (volumes) => {
        volumes.forEach(({ uid: volumeUid, level }) => {
          const participant = remoteUsers.get(String(volumeUid));
          if (participant) participant.speaking = level > 5;
        });
        emitParticipants();
      });
      client.on('network-quality', ({ uplinkNetworkQuality, downlinkNetworkQuality }) => {
        const quality = qualityForNetwork(Math.max(uplinkNetworkQuality, downlinkNetworkQuality));
        onParticipants(Array.from(remoteUsers.values()).map((participant) => ({ ...participant, quality })));
      });
      client.on('token-privilege-will-expire', async () => {
        try {
          const refreshed = await requestToken(activeBreakoutRoomId);
          await client?.renewToken(refreshed.token);
        } catch {
          onStateChange('reconnecting');
        }
      });
      client.on('connection-state-change', (state) => {
        if (state === 'CONNECTED') onStateChange('connected');
        if (state === 'DISCONNECTED') recover();
        if (state === 'RECONNECTING') onStateChange('reconnecting');
      });
    };

    const joinChannel = async (breakoutRoomId?: string | null, createTracks = true) => {
      const payload = await requestToken(breakoutRoomId);
      channel = payload.channel;
      uid = String(payload.uid || uid || Date.now());
      client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      bindClientEvents();
      await client.join(import.meta.env.VITE_VIDEO_APP_ID, channel, payload.token, uid);
      if (!breakoutRoomId && createTracks) {
        [audioTrack, videoTrack] = await Promise.all([
          AgoraRTC.createMicrophoneAudioTrack(),
          AgoraRTC.createCameraVideoTrack(),
        ]);
        await publishLocalTracks();
        client.enableAudioVolumeIndicator();
      } else {
        await publishLocalTracks();
      }
    };

    const recover = () => {
      if (!active || reconnectPromise) return;
      reconnectPromise = (async () => {
        const delays = [1000, 2000, 5000, 15000, 60000];
        while (active && reconnectAttempts < delays.length) {
          onStateChange('reconnecting');
          const baseDelay = delays[reconnectAttempts];
          const jitter = baseDelay * (0.8 + Math.random() * 0.4);
          await new Promise((resolve) => window.setTimeout(resolve, jitter));
          try {
            await client?.leave();
            await joinChannel(activeBreakoutRoomId, false);
            reconnectAttempts = 0;
            onStateChange('connected');
            break;
          } catch {
            reconnectAttempts += 1;
          }
        }
        reconnectPromise = null;
      })();
    };

    try {
      await joinChannel();
      onStateChange('connected');
    } catch (error) {
      const providerError = error as ProviderError;
      if (providerError.status === 403 || providerError.status === 409) throw error;
      onStateChange('reconnecting');
      throw new Error('We could not connect your camera to the class. Check your connection and retry.');
    }

    const closeTracks = () => {
      audioTrack?.close();
      videoTrack?.close();
      screenTrack?.close();
      screenAudioTrack?.close();
      audioTrack = null;
      videoTrack = null;
      screenTrack = null;
      screenAudioTrack = null;
    };

    const connection: ProviderConnection = {
      breakoutRoomId: null,
      breakoutName: null,
      async shareScreen() {
        if (!client) return null;
        const tracks = await AgoraRTC.createScreenVideoTrack({ encoderConfig: '1080p_1' }, 'auto');
        screenTrack = Array.isArray(tracks) ? tracks[0] : tracks;
        screenAudioTrack = Array.isArray(tracks) ? tracks[1] || null : null;
        if (videoTrack) await client.unpublish(videoTrack);
        await client.publish([screenTrack, screenAudioTrack].filter(Boolean) as ILocalVideoTrack[]);
        return navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).catch(() => null);
      },
      async stopScreenShare() {
        if (!client || !screenTrack) return;
        await client.unpublish([screenTrack, screenAudioTrack].filter(Boolean) as ILocalVideoTrack[]);
        screenTrack.close();
        screenAudioTrack?.close();
        screenTrack = null;
        screenAudioTrack = null;
        if (videoTrack) await client.publish(videoTrack);
      },
      async leave() {
        active = false;
        closeTracks();
        await client?.leave();
        await request(`${apiUrl()}/video/rooms/leave`, {
          method: 'POST',
          headers: authHeaders(authToken),
          body: JSON.stringify({ roomId }),
        });
        onStateChange('disconnected');
      },
      async endForAll() {
        active = false;
        closeTracks();
        await client?.leave();
        await request(`${apiUrl()}/video/rooms/${encodeURIComponent(roomId)}`, {
          method: 'DELETE',
          headers: authHeaders(authToken),
        });
        onStateChange('disconnected');
      },
      async switchToBreakout(breakoutRoomId, name) {
        if (!client || !active || !breakoutRoomId) return;
        await client.leave();
        remoteUsers.clear();
        activeBreakoutRoomId = breakoutRoomId;
        await joinChannel(breakoutRoomId);
        connection.breakoutRoomId = breakoutRoomId;
        connection.breakoutName = name ?? null;
        onBreakoutAssignment?.({ breakoutRoomId, breakoutName: name, action: 'open' });
        emitParticipants();
      },
      async returnToMainRoom() {
        if (!client || !active || !connection.breakoutRoomId) return;
        await client.leave();
        remoteUsers.clear();
        activeBreakoutRoomId = null;
        await joinChannel();
        connection.breakoutRoomId = null;
        connection.breakoutName = null;
        onBreakoutAssignment?.({ breakoutRoomId: null, action: 'close' });
        emitParticipants();
      },
      setLocalState(state) {
        if (state.audioEnabled !== undefined) audioTrack?.setEnabled(state.audioEnabled);
        if (state.videoEnabled !== undefined) videoTrack?.setEnabled(state.videoEnabled);
      },
    };

    onParticipants([]);
    return connection;
  }
}
