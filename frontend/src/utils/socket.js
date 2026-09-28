import { io as ioClient } from 'socket.io-client';
import { recordClientTelemetry } from '../lib/telemetry';

let socket = null;
let notificationHandler = null;
let connectionStateHandler = null;
let currentConnectionState = 'disconnected';
const connectionSubscribers = new Set();
const connectionSources = new Map();
const retryDelays = [1000, 2000, 5000, 15000, 60000];
let retryTimer = null;
let retryAttempt = 0;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '') + '/';

function updateVisibleConnectionState() {
  currentConnectionState = [...connectionSources.values()].includes('reconnecting')
    ? 'reconnecting'
    : [...connectionSources.values()].includes('connected') ? 'connected' : 'disconnected';
  connectionSubscribers.forEach((handler) => handler(currentConnectionState));
}

function notifyConnectionState(state, attempt) {
  connectionSources.set('socket', state);
  updateVisibleConnectionState();
  connectionStateHandler?.(state, attempt);
}

function clearRetryTimer() {
  if (retryTimer) window.clearTimeout(retryTimer);
  retryTimer = null;
}

function scheduleReconnect() {
  if (!socket || retryTimer || socket.connected) return;
  const baseDelay = retryDelays[Math.min(retryAttempt, retryDelays.length - 1)];
  const jitter = baseDelay * (Math.random() * 0.5 - 0.25);
  const delay = Math.max(0, Math.round(baseDelay + jitter));
  retryAttempt += 1;
  notifyConnectionState('reconnecting', retryAttempt);
  recordClientTelemetry('reconnects', { attempt: retryAttempt });
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    socket?.connect();
  }, delay);
}

export function initSocket(token) {
  if (!token) return null;
  if (socket) return socket;

  socket = ioClient(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  });

  socket.on('connect', () => {
    clearRetryTimer();
    retryAttempt = 0;
    notifyConnectionState('connected');
  });
  socket.on('connect_error', () => scheduleReconnect());

  socket.on('notification', (notif) => {
    if (notificationHandler) notificationHandler(notif);
  });

  socket.on('disconnect', (reason) => {
    if (reason !== 'io client disconnect') scheduleReconnect();
  });

  return socket;
}

export function setNotificationHandler(fn) {
  notificationHandler = fn;
}

export function setConnectionStateHandler(fn) {
  connectionStateHandler = fn;
}

export function subscribeConnectionState(fn) {
  connectionSubscribers.add(fn);
  fn(currentConnectionState);
  return () => connectionSubscribers.delete(fn);
}

export function reportProviderConnectionState(state) {
  connectionSources.set('provider', state);
  updateVisibleConnectionState();
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  clearRetryTimer();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  retryAttempt = 0;
  connectionSources.clear();
  connectionSources.set('socket', 'disconnected');
  updateVisibleConnectionState();
  connectionStateHandler = null;
}
