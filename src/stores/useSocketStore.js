import { create } from 'zustand';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { useChatStore } from './useChatStore';
import { useCallStore } from './useCallStore';
import toast from 'react-hot-toast';

const typingTimers = new Map();

const clearTypingTimer = (key) => {
  if (typingTimers.has(key)) {
    clearTimeout(typingTimers.get(key));
    typingTimers.delete(key);
  }
};

export const useSocketStore = create((set, get) => ({
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: {}, // { [conversationId]: string[] }

  connect: () => {
    const socket = connectSocket();
    if (!socket) return;

    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // Real-time presence updates from backend (io.emit('presence:updated', { userId, isOnline }))
    socket.on('presence:updated', ({ userId, isOnline }) => {
      if (!userId) return;
      const uId = String(userId);
      set((state) => {
        const updated = new Set(state.onlineUsers);
        if (isOnline) {
          updated.add(uId);
        } else {
          updated.delete(uId);
        }

        // If user went offline, clear any active typing indicators for this user
        let updatedTyping = state.typingUsers;
        if (!isOnline) {
          updatedTyping = { ...state.typingUsers };
          Object.keys(updatedTyping).forEach((cId) => {
            clearTypingTimer(`${cId}_${uId}`);
            updatedTyping[cId] = (updatedTyping[cId] || []).filter(
              (item) => item !== uId
            );
          });
        }

        return { onlineUsers: updated, typingUsers: updatedTyping };
      });
    });

    socket.on('users:online', (userIds) => {
      if (Array.isArray(userIds)) {
        set({ onlineUsers: new Set(userIds.map(String)) });
      }
    });

    socket.on('user:online', (userId) => {
      if (!userId) return;
      set((state) => {
        const updated = new Set(state.onlineUsers);
        updated.add(String(userId));
        return { onlineUsers: updated };
      });
    });

    socket.on('user:offline', (userId) => {
      if (!userId) return;
      set((state) => {
        const updated = new Set(state.onlineUsers);
        updated.delete(String(userId));
        return { onlineUsers: updated };
      });
    });

    // Real-time message events
    socket.on('message:new', (message) => {
      useChatStore.getState().addMessage(message);
      // Clear typing indicator for sender upon receiving a message
      const senderName = message?.sender?.username || message?.sender?.name;
      const senderId = String(message?.sender?._id || message?.sender?.id || message?.sender || '');
      const convId = String(message?.conversationId || message?.conversation?._id || message?.conversation || '');
      if (convId) {
        clearTypingTimer(`${convId}_${senderId}`);
        clearTypingTimer(`${convId}_${senderName}`);
        set((state) => {
          const list = state.typingUsers[convId] || [];
          return {
            typingUsers: {
              ...state.typingUsers,
              [convId]: list.filter((u) => u !== senderName && u !== senderId),
            },
          };
        });
      }
    });

    socket.on('message:received', (message) => {
      useChatStore.getState().addMessage(message);
    });

    socket.on('conversation:lastMessage', ({ conversationId, lastMessage, message }) => {
      useChatStore.getState().updateConversationLastMessage({ conversationId, lastMessage, message });
    });

    socket.on('message:edited', (editedMessage) => {
      useChatStore.getState().updateMessage(editedMessage);
    });

    socket.on('message:deleted', ({ messageId, conversationId }) => {
      useChatStore.getState().removeMessage(messageId, conversationId);
    });

    socket.on('message:receipt', ({ messageId, conversationId, userId, type, status }) => {
      const effectiveStatus = status || type;
      useChatStore.getState().updateMessageStatus(messageId, effectiveStatus, conversationId);
    });

    // Real-time typing events with safety timeout & robust cleanup
    socket.on('typing:start', ({ conversationId, userId, username }) => {
      if (!conversationId) return;
      const displayName = username || (userId ? String(userId) : 'User');
      const timerKey = `${conversationId}_${userId || username}`;

      // Reset any existing timeout
      clearTypingTimer(timerKey);

      set((state) => {
        const currentList = state.typingUsers[conversationId] || [];
        if (!currentList.includes(displayName)) {
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: [...currentList, displayName],
            },
          };
        }
        return state;
      });

      // Safety timeout: auto-remove typing indicator after 3 seconds if no stop received
      const timeoutId = setTimeout(() => {
        clearTypingTimer(timerKey);
        set((state) => {
          const currentList = state.typingUsers[conversationId] || [];
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: currentList.filter(
                (item) => item !== displayName && item !== username && item !== String(userId)
              ),
            },
          };
        });
      }, 3000);

      typingTimers.set(timerKey, timeoutId);
    });

    socket.on('typing:stop', ({ conversationId, userId, username }) => {
      const uId = userId ? String(userId) : null;
      const uName = username || null;

      if (conversationId) {
        clearTypingTimer(`${conversationId}_${uId}`);
        clearTypingTimer(`${conversationId}_${uName}`);

        set((state) => {
          const currentList = state.typingUsers[conversationId] || [];
          return {
            typingUsers: {
              ...state.typingUsers,
              [conversationId]: currentList.filter(
                (item) => item !== uName && item !== uId
              ),
            },
          };
        });
      } else {
        // Disconnect broadcast without conversationId - clear from all conversations
        set((state) => {
          const updated = { ...state.typingUsers };
          Object.keys(updated).forEach((cId) => {
            clearTypingTimer(`${cId}_${uId}`);
            clearTypingTimer(`${cId}_${uName}`);
            updated[cId] = (updated[cId] || []).filter(
              (item) => item !== uName && item !== uId
            );
          });
          return { typingUsers: updated };
        });
      }
    });

    // Conversation updates
    socket.on('conversation:updated', (conversation) => {
      useChatStore.getState().updateConversation(conversation);
    });

    // WebRTC Voice Calling events
    socket.on('call:incoming', (data) => {
      useCallStore.getState().handleIncomingCall(data);
    });

    socket.on('call:accepted', (data) => {
      useCallStore.getState().handleCallAccepted(data);
    });

    socket.on('call:rejected', (data) => {
      useCallStore.getState().handleCallRejected(data);
    });

    socket.on('call:ice-candidate', (data) => {
      useCallStore.getState().handleIceCandidate(data);
    });

    socket.on('call:ended', () => {
      useCallStore.getState().handleCallEnded();
    });

    socket.on('call:unavailable', () => {
      toast('User is offline and cannot be reached', { icon: '📞' });
      useCallStore.getState().cleanup();
    });
  },

  disconnect: () => {
    disconnectSocket();
    typingTimers.forEach((timer) => clearTimeout(timer));
    typingTimers.clear();
    useCallStore.getState().cleanup();
    set({ isConnected: false, onlineUsers: new Set(), typingUsers: {} });
  },

  emitTyping: (conversationId, isTyping) => {
    const socket = getSocket();
    if (!socket || !socket.connected) return;
    const event = isTyping ? 'typing:start' : 'typing:stop';
    socket.emit(event, { conversationId });
  },

  joinConversation: (conversationId) => {
    const socket = getSocket();
    if (socket && socket.connected && conversationId) {
      // Backend expects string conversationId directly
      socket.emit('conversation:join', conversationId);
    }
  },

  leaveConversation: (conversationId) => {
    const socket = getSocket();
    if (socket && socket.connected && conversationId) {
      socket.emit('conversation:leave', conversationId);
    }
  },

  isUserOnline: (userId) => {
    if (!userId) return false;
    return get().onlineUsers.has(String(userId));
  },
}));

export default useSocketStore;
