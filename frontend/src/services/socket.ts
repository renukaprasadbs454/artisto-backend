import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

/**
 * Get or create the Socket.io client instance.
 * Connects with the current access token from the auth store.
 * autoConnect is false — call connectSocket() explicitly after auth.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      auth: { token: useAuthStore.getState().accessToken },
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }
  return socket;
}

/**
 * Connect the socket (call after auth is confirmed).
 */
export function connectSocket(): void {
  const s = getSocket();
  // Update the auth token before connecting
  s.auth = { token: useAuthStore.getState().accessToken };
  if (!s.connected) {
    s.connect();
  }
}

/**
 * Disconnect and destroy the socket instance.
 * Call on logout.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Reconnect with a fresh token (call after token refresh).
 */
export function reconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket.auth = { token: useAuthStore.getState().accessToken };
    socket.connect();
  }
}
