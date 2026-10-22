'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { getSocket } from '@/lib/socket';

export default function SocketProvider({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();

      // Emit offline immediately on page unload/close
      const handleBeforeUnload = () => {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit('user:offline');
          socket.disconnect();
        }
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        disconnect();
      };
    } else {
      disconnect();
    }
  }, [isAuthenticated, user, connect, disconnect]);

  return <>{children}</>;
}
