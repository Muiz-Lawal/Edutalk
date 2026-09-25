/// <reference types="vite/client" />
import { initSocket } from '../utils/socket';
import { RealVideoProvider } from './video-providers/real';
// @ts-ignore Shared JavaScript API client.
import api from '../utils/api.js';

async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await api.request({
    url: url.replace(import.meta.env.VITE_API_URL || 'http://localhost:5000/api', ''),
    method: options.method || 'GET',
    data: options.body ? JSON.parse(String(options.body)) : undefined,
  });
  return { ok: true, status: response.status, json: async () => response.data };
}

export interface VideoProvider {
  createRoom(sessionId: string): Promise<{ roomId: string; joinUrlHost: string; joinUrlStudent: string }>;
  getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
  createConnection(options: {
    roomId: string;
    token: string | null;
    onStateChange: (state: 'connected' | 'reconnecting' | 'disconnected') => void;
    onParticipants: (participants: ProviderParticipant[]) => void;
    onBreakoutAssignment?: (assignment: { breakoutRoomId: string | null; breakoutName?: string; action: 'open' | 'closing' | 'close' }) => void;
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
  videoTrack?: { play(element: HTMLElement): void; stop?(): void };
  audioTrack?: { play(element?: HTMLElement): void; stop?(): void };
}

export interface ProviderConnection {
  shareScreen(): Promise<MediaStream | null>;
  stopScreenShare(): Promise<void>;
  leave(): Promise<void>;
  endForAll(): Promise<void>;
  switchToBreakout?(roomId: string | null, name?: string): Promise<void>;
  returnToMainRoom?(): Promise<void>;
  breakoutRoomId?: string | null;
  breakoutName?: string | null;
  setLocalState(state: { audioEnabled?: boolean; videoEnabled?: boolean; handRaised?: boolean }): void;
}

export class DevMockProvider implements VideoProvider {
  async createRoom(sessionId: string) {
    const token = localStorage.getItem('token');
    try {
      const response = await apiRequest(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/video/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ sessionId }),
      });
      if (response.ok) {
        const room = await response.json();
        const created = room.videoRoom || room;
        return { ...created, roomId: created.roomId, joinUrlHost: `/session/${sessionId}?role=host`, joinUrlStudent: `/session/${sessionId}` };
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

  async createConnection({ roomId: _roomId, onStateChange, onParticipants, onBreakoutAssignment }: Parameters<VideoProvider['createConnection']>[0]) {
    let screenStream: MediaStream | null = null;
    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socket = initSocket(token);
    const assignmentHandler = (assignment: { breakoutRoomId: string | null; breakoutName?: string; action: 'open' | 'closing' | 'close' }) => onBreakoutAssignment?.(assignment);
    socket?.on('breakout:assignment', assignmentHandler);
    const request = async (path: string, options: RequestInit = {}) => apiRequest(`${apiUrl}${path}`, options);
    try {
      const response = await request('/video/rooms/join', { method: 'POST', body: JSON.stringify({ roomId: _roomId }) });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        const error = new Error(details.message || 'Room join failed');
        (error as Error & { code?: string; status?: number }).code = details.code;
        (error as Error & { code?: string; status?: number }).status = response.status;
        throw error;
      }
      onStateChange('connected');
    } catch (error) {
      if ((error as Error & { status?: number }).status === 403 || (error as Error & { status?: number }).status === 409) throw error;
      onStateChange('reconnecting');
      onStateChange('connected');
    }
    onParticipants([]);
    const connection: ProviderConnection = {
      breakoutRoomId: null,
      breakoutName: null,
      async shareScreen() {
        screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        return screenStream;
      },
      async stopScreenShare() {
        screenStream?.getTracks().forEach((track) => track.stop());
        screenStream = null;
      },
      async switchToBreakout(roomId, name) {
        connection.breakoutRoomId = roomId ?? null;
        connection.breakoutName = name ?? null;
        onParticipants([
          {
            id: 'local',
            name: 'You',
            isHost: false,
            audioEnabled: true,
            videoEnabled: true,
            speaking: false,
            handRaised: false,
            quality: 'good',
          },
        ]);
      },
      async returnToMainRoom() {
        connection.breakoutRoomId = null;
        connection.breakoutName = null;
        onParticipants([]);
      },
      async leave() {
        socket?.off('breakout:assignment', assignmentHandler);
        await request('/video/rooms/leave', { method: 'POST', body: JSON.stringify({ roomId: _roomId }) });
        onStateChange('disconnected');
      },
      async endForAll() {
        socket?.off('breakout:assignment', assignmentHandler);
        await request(`/video/rooms/${encodeURIComponent(_roomId)}`, { method: 'DELETE' });
        onStateChange('disconnected');
      },
      setLocalState() {},
    };
    return connection;
  }
}

export const videoProvider: VideoProvider = new DevMockProvider();

export function getVideoProvider(): VideoProvider {
  const configured = (import.meta.env.VITE_VIDEO_PROVIDER || '').trim().toLowerCase();
  if (configured === 'real') return new RealVideoProvider();
  return videoProvider;
}
