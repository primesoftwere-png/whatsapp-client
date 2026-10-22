import { io } from 'socket.io-client';

let socket = null;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const getSocket = () => socket;

export const connectSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    withCredentials: true,
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
