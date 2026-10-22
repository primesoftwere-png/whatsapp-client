import { io } from 'socket.io-client';
import { getStoredToken } from './api';

let socket = null;

export const getSocketBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLive = hostname !== 'localhost' && hostname !== '127.0.0.1';
    if (isLive && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return 'https://whatsapp-clone-1nlb.onrender.com';
    }
  }
  return envUrl || 'http://localhost:5000';
};

export const getSocket = () => socket;

export const connectSocket = () => {
  const token = getStoredToken();
  const socketUrl = getSocketBaseUrl();

  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    if (token) {
      socket.auth = { token };
    }
    socket.connect();
    return socket;
  }

  socket = io(socketUrl, {
    withCredentials: true,
    auth: {
      token: token || '',
    },
    extraHeaders: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {},
    autoConnect: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    // Socket connected successfully
  });

  socket.on('connect_error', (error) => {
    console.warn('Socket connection error:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { getSocket, connectSocket, disconnectSocket };
