import { io as ioClient } from 'socket.io-client';

let socket = null;
let notificationHandler = null;

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '') + '/';

export function initSocket(token) {
  if (!token) return null;
  if (socket && socket.connected) return socket;

  socket = ioClient(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected', socket.id);
  });

  socket.on('notification', (notif) => {
    if (notificationHandler) notificationHandler(notif);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  return socket;
}

export function setNotificationHandler(fn) {
  notificationHandler = fn;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
