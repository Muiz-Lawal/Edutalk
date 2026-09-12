/// <reference types="vite/client" />

export interface VideoProvider {
  createRoom(sessionId: string): Promise<{ roomId: string; joinUrlHost: string; joinUrlStudent: string }>;
}

export class DevMockProvider implements VideoProvider {
  async createRoom(sessionId: string) {
    const roomId = `dev-room-${sessionId}-${Math.random().toString(36).slice(2, 10)}`;
    return {
      roomId,
      joinUrlHost: `/session/${sessionId}?role=host`,
      joinUrlStudent: `/session/${sessionId}`,
    };
  }
}

export const videoProvider: VideoProvider = new DevMockProvider();

export function getVideoProvider(): VideoProvider {
  const configured = (import.meta.env.VITE_VIDEO_PROVIDER || '').trim();
  if (!configured) return videoProvider;
  return videoProvider;
}
