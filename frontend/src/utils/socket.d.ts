import { Socket } from 'socket.io-client';

export function initSocket(token: string | null): Socket | null;
export function setNotificationHandler(fn: (notif: unknown) => void): void;
export function setConnectionStateHandler(fn: ((state: 'connected' | 'reconnecting' | 'disconnected', attempt?: number) => void) | null): void;
export function subscribeConnectionState(fn: (state: 'connected' | 'reconnecting' | 'disconnected') => void): () => void;
export function reportProviderConnectionState(state: 'connected' | 'reconnecting' | 'disconnected'): void;
export function getSocket(): Socket | null;
export function closeSocket(): void;
