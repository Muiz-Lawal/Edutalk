import { initSocket } from '../utils/socket.js';

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

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function token() {
  return localStorage.getItem('token');
}

async function request(sessionId: string, options: RequestInit = {}) {
  const response = await fetch(`${apiUrl}/session-whiteboard/${sessionId}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error('Whiteboard request failed');
  return response.json();
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
