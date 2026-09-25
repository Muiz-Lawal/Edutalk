import { initSocket } from '../utils/socket.js';
// @ts-ignore API client is JavaScript shared by the React and TypeScript modules.
import api from '../utils/api.js';

export type WhiteboardTool = 'select' | 'pen' | 'marker' | 'eraser' | 'rect' | 'ellipse' | 'arrow' | 'line' | 'text' | 'sticky' | 'laser';
export type WhiteboardPoint = { x: number; y: number };
export type WhiteboardStroke = {
  id: string;
  tool: Exclude<WhiteboardTool, 'select' | 'laser'>;
  color: string;
  width: number;
  points: WhiteboardPoint[];
  text?: string;
};

export type WhiteboardState = {
  strokes: WhiteboardStroke[];
  studentsCanDraw: boolean;
  isHost: boolean;
};

function token() {
  return localStorage.getItem('token');
}

async function request(sessionId: string, options: RequestInit = {}) {
  const response = await api.request({
    url: `/session-whiteboard/${sessionId}`,
    method: (options.method || 'GET').toLowerCase(),
    data: options.body ? JSON.parse(String(options.body)) : undefined,
  });
  return response.data;
}

export async function loadWhiteboard(sessionId: string): Promise<WhiteboardState> {
  return request(sessionId);
}

export async function addWhiteboardStroke(sessionId: string, stroke: WhiteboardStroke) {
  const state = await request(sessionId, { method: 'PATCH', body: JSON.stringify({ action: 'add', stroke }) });
  broadcast(sessionId, { type: 'stroke', stroke });
  return state;
}

export async function setStudentsCanDraw(sessionId: string, studentsCanDraw: boolean) {
  const state = await request(sessionId, { method: 'PATCH', body: JSON.stringify({ action: 'permission', studentsCanDraw }) });
  broadcast(sessionId, { type: 'permission', studentsCanDraw });
  return state;
}

export async function clearWhiteboard(sessionId: string) {
  const state = await request(sessionId, { method: 'PATCH', body: JSON.stringify({ action: 'clear' }) });
  broadcast(sessionId, { type: 'clear' });
  return state;
}

export function subscribeWhiteboard(sessionId: string, onEvent: (event: { type: string; stroke?: WhiteboardStroke; studentsCanDraw?: boolean }) => void) {
  const socket = initSocket(token());
  if (!socket) return () => {};
  socket.emit('whiteboard:join', { sessionId });
  const handler = (event: { type: string; stroke?: WhiteboardStroke; studentsCanDraw?: boolean }) => onEvent(event);
  socket.on(`whiteboard:event:${sessionId}`, handler);
  return () => {
    socket.off(`whiteboard:event:${sessionId}`, handler);
    socket.emit('whiteboard:leave', { sessionId });
  };
}

function broadcast(sessionId: string, event: { type: string; stroke?: WhiteboardStroke; studentsCanDraw?: boolean }) {
  const socket = initSocket(token());
  socket?.emit('whiteboard:event', { sessionId, event });
}
