/// <reference types="vite/client" />

export interface VideoProvider {
  createRoom(sessionId: string): Promise<{ roomId: string; joinUrlHost: string; joinUrlStudent: string }>;
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  createConnection(options: {
    roomId: string;
    token: string | null;
    onStateChange: (state: 'connected' | 'reconnecting' | 'disconnected') => void;
    onParticipants: (participants: ProviderParticipant[]) => void;
  }): Promise<ProviderConnection>;
}

export interface ProviderParticipant {
  id: string;
  name: string;
  isHost?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  speaking?: boolean;
  handRaised?: boolean;
  quality?: 'good' | 'fair' | 'poor';
  stream?: MediaStream;
}

export interface ProviderConnection {
  shareScreen(): Promise<MediaStream | null>;
  stopScreenShare(): Promise<void>;
  leave(): Promise<void>;
  endForAll(): Promise<void>;
  setLocalState(state: { audioEnabled?: boolean; videoEnabled?: boolean; handRaised?: boolean }): void;
}

export class DevMockProvider implements VideoProvider {
  async createRoom(sessionId: string) {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/video/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sessionId }),
      });
      if (response.ok) {
        const room = await response.json();
        return { ...room, joinUrlHost: `/session/${sessionId}?role=host`, joinUrlStudent: `/session/${sessionId}` };
      }
    } catch {
      // The development provider remains usable when the optional room API is unavailable.
    }
    const roomId = `dev-room-${sessionId}-${Math.random().toString(36).slice(2, 10)}`;
    return {
      roomId,
      joinUrlHost: `/session/${sessionId}?role=host`,
      joinUrlStudent: `/session/${sessionId}`,
    };
  }

  getUserMedia(constraints: MediaStreamConstraints) {
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  async createConnection({ roomId: _roomId, onStateChange, onParticipants }: Parameters<VideoProvider['createConnection']>[0]) {
    let screenStream: MediaStream | null = null;
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const request = async (path: string, options: RequestInit = {}) => fetch(`${apiUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
    });
    try {
      const response = await request('/video/rooms/join', { method: 'POST', body: JSON.stringify({ roomId: _roomId }) });
      if (!response.ok) throw new Error('Room join failed');
      onStateChange('connected');
    } catch {
      onStateChange('reconnecting');
      onStateChange('connected');
    }
    onParticipants([]);
    return {
      async shareScreen() {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        return screenStream;
      },
      async stopScreenShare() {
        screenStream?.getTracks().forEach((track) => track.stop());
        screenStream = null;
      },
      async leave() {
        await request('/video/rooms/leave', { method: 'POST', body: JSON.stringify({ roomId: _roomId }) });
        onStateChange('disconnected');
      },
      async endForAll() {
        await request(`/video/rooms/${encodeURIComponent(_roomId)}`, { method: 'DELETE' });
        onStateChange('disconnected');
      },
      setLocalState() {},
    } satisfies ProviderConnection;
  }
}

export const videoProvider: VideoProvider = new DevMockProvider();

export function getVideoProvider(): VideoProvider {
  const configured = (import.meta.env.VITE_VIDEO_PROVIDER || '').trim();
  if (!configured) return videoProvider;
  return videoProvider;
}
