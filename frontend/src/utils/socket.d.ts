import { Socket } from 'socket.io-client';

export function initSocket(token: string | null): Socket | null;
export function setNotificationHandler(fn: (notif: unknown) => void): void;
export function getSocket(): Socket | null;
export function closeSocket(): void;
