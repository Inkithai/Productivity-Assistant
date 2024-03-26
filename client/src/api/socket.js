import { io } from 'socket.io-client';

import { getToken } from './client.js';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

let socket = null;

export function connectSocket() {
  if (!socket) {
    socket = io(BASE_URL || window.location.origin, {
      autoConnect: false,
      auth: (cb) => cb({ token: getToken() }),
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
