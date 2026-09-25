import { io as ioClient } from 'socket.io-client';

let socket = null;
let notificationHandler = null;
let connectionStateHandler = null;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '') + '/';

export function initSocket(token) {
  if (!token) return null;
  if (socket && socket.connected) return socket;

  socket = ioClient(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 60000,
    randomizationFactor: 0.25,
  });

  socket.on('connect', () => {
    console.log('Socket connected', socket.id);
    connectionStateHandler?.('connected');
  });
  socket.on('reconnect_attempt', (attempt) => {
    connectionStateHandler?.('reconnecting', attempt);
  });
  socket.on('connect_error', () => connectionStateHandler?.('reconnecting'));

  socket.on('notification', (notif) => {
    if (notificationHandler) notificationHandler(notif);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
    if (reason !== 'io client disconnect') connectionStateHandler?.('reconnecting');
  });

  return socket;
}

export function setNotificationHandler(fn) {
  notificationHandler = fn;
}

export function setConnectionStateHandler(fn) {
  connectionStateHandler = fn;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  connectionStateHandler = null;
}
