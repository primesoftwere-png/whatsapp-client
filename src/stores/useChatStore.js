import { create } from 'zustand';
import api from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuthStore } from './useAuthStore';
import toast from 'react-hot-toast';

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  activeFilter: 'all', // 'all' | 'unread' | 'groups'
  searchQuery: '',

  // Pagination states
  conversationsPage: 1,
  hasMoreConversations: true,
  isLoadingMoreConversations: false,

  hasMoreMessages: true,
  isLoadingMoreMessages: false,

  setFilter: (filter) => set({ activeFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  fetchConversations: async (page = 1, append = false) => {
    if (page === 1) {
      set({ isLoadingConversations: true, conversationsPage: 1 });
    } else {
      set({ isLoadingMoreConversations: true });
    }

    try {
      const data = await api.get(`/conversations?page=${page}&limit=20`);
      const newItems = Array.isArray(data) ? data : data.conversations || [];
      const totalPages = data.pagination?.pages || 1;
      const hasMore = page < totalPages;

      set((state) => {
        let combined;
        if (append) {
          const existingIds = new Set(state.conversations.map((c) => String(c._id || c.id)));
          const filteredNew = newItems.filter((c) => !existingIds.has(String(c._id || c.id)));
          combined = [...state.conversations, ...filteredNew];
        } else {
          combined = newItems;
        }

        return {
          conversations: combined,
          conversationsPage: page,
          hasMoreConversations: hasMore,
          isLoadingConversations: false,
          isLoadingMoreConversations: false,
        };
      });
      return newItems;
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      set({ isLoadingConversations: false, isLoadingMoreConversations: false });
      return [];
    }
  },

  fetchMoreConversations: async () => {
    const { conversationsPage, hasMoreConversations, isLoadingConversations, isLoadingMoreConversations } = get();
    if (!hasMoreConversations || isLoadingConversations || isLoadingMoreConversations) return;
    return get().fetchConversations(conversationsPage + 1, true);
  },

  fetchConversation: async (conversationId) => {
    if (!conversationId) return null;
    try {
      const data = await api.get(`/conversations/${conversationId}`);
      const conversation = data.conversation || data;
      set({ activeConversation: conversation });
      return conversation;
    } catch (err) {
      console.error('Failed to fetch conversation:', err);
      return null;
    }
  },

  setActiveConversation: (conversation) => {
    const currentActiveId = get().activeConversation?._id || get().activeConversation?.id;
    const newId = conversation?._id || conversation?.id;
    set({ activeConversation: conversation });
    if (newId && String(currentActiveId) !== String(newId)) {
      get().fetchMessages(newId);
      get().markConversationRead(newId);
    } else if (!newId) {
      set({ messages: [] });
    }
  },

  fetchMessages: async (conversationId) => {
    if (!conversationId) return;
    set({ isLoadingMessages: true, hasMoreMessages: true });
    try {
      const data = await api.get(`/messages/conversations/${conversationId}/messages?limit=30`);
      const messages = Array.isArray(data) ? data : data.messages || [];
      const hasMore = Boolean(data.hasMore);
      set({ messages, hasMoreMessages: hasMore, isLoadingMessages: false });
      return messages;
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      set({ messages: [], isLoadingMessages: false, hasMoreMessages: false });
      return [];
    }
  },

  fetchMoreMessages: async (conversationId) => {
    const { messages, hasMoreMessages, isLoadingMessages, isLoadingMoreMessages } = get();
    if (!conversationId || !hasMoreMessages || isLoadingMessages || isLoadingMoreMessages || messages.length === 0) {
      return [];
    }

    set({ isLoadingMoreMessages: true });
    try {
      const oldestMsg = messages[0];
      const oldestId = oldestMsg._id || oldestMsg.id;
      const data = await api.get(`/messages/conversations/${conversationId}/messages?before=${oldestId}&limit=30`);
      const olderMessages = Array.isArray(data) ? data : data.messages || [];
      const hasMore = Boolean(data.hasMore);

      set((state) => {
        const existingIds = new Set(state.messages.map((m) => String(m._id || m.id)));
        const newUnique = olderMessages.filter((m) => !existingIds.has(String(m._id || m.id)));
        return {
          messages: [...newUnique, ...state.messages],
          hasMoreMessages: hasMore,
          isLoadingMoreMessages: false,
        };
      });
      return olderMessages;
    } catch (err) {
      console.error('Failed to fetch older messages:', err);
      set({ isLoadingMoreMessages: false });
      return [];
    }
  },

  markConversationRead: async (conversationId) => {
    if (!conversationId) return;
    try {
      // Clear unread count locally for this conversation
      const targetId = String(conversationId);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          String(c._id || c.id) === targetId ? { ...c, unreadCount: 0 } : c
        ),
      }));

      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('conversation:read', { conversationId });
      }
      await api.post(`/messages/conversations/${conversationId}/read`, {});
    } catch {
      // ignore
    }
  },

  sendMessage: async (conversationId, payload) => {
    try {
      const data = await api.post(`/messages/conversations/${conversationId}/messages`, payload);
      const newMessage = data.message || data;
      get().addMessage(newMessage);
      return newMessage;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  },

  addMessage: (message) => {
    if (!message) return;
    const msgId = message._id || message.id;
    if (!msgId) return; // Discard invalid or incomplete message objects

    const { activeConversation, messages, conversations } = get();
    const currentConvId = activeConversation?._id || activeConversation?.id;
    const msgConvId = message.conversationId || message.conversation?._id || message.conversation;

    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser?._id || currentUser?.id;
    const senderId = message.sender?._id || message.sender?.id || message.sender;
    const isSentByMe = Boolean(currentUserId && senderId && String(currentUserId) === String(senderId));
    const isDifferentConversation = !currentConvId || (msgConvId && String(currentConvId) !== String(msgConvId));

    // If message belongs to active conversation, append it (if not duplicate)
    if (currentConvId && msgConvId && String(currentConvId) === String(msgConvId)) {
      const exists = messages.some((m) => {
        const mId = m._id || m.id;
        if (mId && msgId && String(mId) === String(msgId)) return true;
        if (m.clientMessageId && message.clientMessageId && m.clientMessageId === message.clientMessageId) return true;
        return false;
      });

      if (!exists) {
        set({ messages: [...messages, message] });
      } else {
        // Update existing message if status updated
        set({
          messages: messages.map((m) => {
            const mId = m._id || m.id;
            if (mId && msgId && String(mId) === String(msgId)) {
              return { ...m, ...message };
            }
            if (m.clientMessageId && message.clientMessageId && m.clientMessageId === message.clientMessageId) {
              return { ...m, ...message };
            }
            return m;
          }),
        });
      }
    }

    // Check if conversation already exists in our local list
    const convExists = conversations.some((c) => String(c._id || c.id) === String(msgConvId));

    if (!convExists && msgConvId) {
      // New conversation initiated by someone else: re-fetch so it appears at top of sidebar
      get().fetchConversations();
    } else {
      // Update conversation lastMessage, unread count & move to top of conversations list
      const updatedConversations = conversations.map((c) => {
        const cId = c._id || c.id;
        if (String(cId) === String(msgConvId)) {
          const newUnread = !isSentByMe && isDifferentConversation ? (c.unreadCount || 0) + 1 : (c.unreadCount || 0);
          return {
            ...c,
            lastMessage: message,
            unreadCount: newUnread,
            updatedAt: message.createdAt || new Date().toISOString(),
          };
        }
        return c;
      });

      // Sort conversations so the latest message is always at the top
      updatedConversations.sort((a, b) => {
        const dateA = new Date(a.lastMessage?.timestamp || a.lastMessage?.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.lastMessage?.timestamp || b.lastMessage?.createdAt || b.updatedAt || 0);
        return dateB - dateA;
      });

      set({ conversations: updatedConversations });
    }

    // Show instant notification toast if the message is from someone else and NOT in currently open conversation
    if (!isSentByMe && isDifferentConversation) {
      const senderName = message.sender?.name || message.sender?.username || 'Someone';
      const snippet = message.content || (message.attachments?.length ? '📎 Sent an attachment' : 'New message');

      toast((t) => (
        <div
          onClick={() => {
            toast.dismiss(t.id);
            if (msgConvId) {
              const target = get().conversations.find((c) => String(c._id || c.id) === String(msgConvId));
              if (target) {
                get().setActiveConversation(target);
              }
              window.location.href = `/chats/${msgConvId}`;
            }
          }}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 max-w-xs">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {senderName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {snippet}
            </p>
          </div>
        </div>
      ), {
        id: `toast-${msgConvId}-${msgId}`,
        duration: 4500,
        position: 'top-right',
        style: {
          borderRadius: '16px',
          background: 'rgba(24, 24, 27, 0.95)',
          color: '#fff',
          border: '1px solid rgba(63, 63, 70, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '10px 14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        },
      });
    }
  },

  updateConversationLastMessage: ({ conversationId, lastMessage, message }) => {
    const { activeConversation, conversations } = get();
    const currentConvId = activeConversation?._id || activeConversation?.id;
    const targetConvId = String(conversationId || message?.conversationId || message?.conversation?._id || message?.conversation || '');
    if (!targetConvId) return;

    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser?._id || currentUser?.id;
    const senderId = message?.sender?._id || message?.sender?.id || message?.sender || lastMessage?.sender;
    const isSentByMe = Boolean(currentUserId && senderId && String(currentUserId) === String(senderId));
    const isDifferentConversation = !currentConvId || String(currentConvId) !== targetConvId;

    const convExists = conversations.some((c) => String(c._id || c.id) === targetConvId);
    if (!convExists) {
      get().fetchConversations();
      return;
    }

    const updatedConversations = conversations.map((c) => {
      const cId = String(c._id || c.id);
      if (cId === targetConvId) {
        const newUnread = !isSentByMe && isDifferentConversation ? (c.unreadCount || 0) + 1 : (c.unreadCount || 0);
        return {
          ...c,
          lastMessage: message || lastMessage || c.lastMessage,
          unreadCount: newUnread,
          updatedAt: message?.createdAt || lastMessage?.timestamp || new Date().toISOString(),
        };
      }
      return c;
    });

    updatedConversations.sort((a, b) => {
      const dateA = new Date(a.lastMessage?.timestamp || a.lastMessage?.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.lastMessage?.timestamp || b.lastMessage?.createdAt || b.updatedAt || 0);
      return dateB - dateA;
    });

    set({ conversations: updatedConversations });

    if (!isSentByMe && isDifferentConversation && (message || lastMessage)) {
      const senderName = message?.sender?.name || message?.sender?.username || 'New message';
      const snippet = message?.content || (message?.attachments?.length ? '📎 Sent an attachment' : lastMessage?.content || 'New message');
      const msgKey = message?._id || message?.id || lastMessage?.timestamp || Date.now();

      toast((t) => (
        <div
          onClick={() => {
            toast.dismiss(t.id);
            window.location.href = `/chats/${targetConvId}`;
          }}
          className="flex items-center gap-3 cursor-pointer select-none"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
            {senderName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 max-w-xs">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {senderName}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {snippet}
            </p>
          </div>
        </div>
      ), {
        id: `toast-${targetConvId}-${msgKey}`,
        duration: 4500,
        position: 'top-right',
        style: {
          borderRadius: '16px',
          background: 'rgba(24, 24, 27, 0.95)',
          color: '#fff',
          border: '1px solid rgba(63, 63, 70, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '10px 14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        },
      });
    }
  },

  updateMessage: (updatedMsg) => {
    if (!updatedMsg) return;
    const targetId = String(updatedMsg._id || updatedMsg.id);
    set((state) => ({
      messages: state.messages.map((m) =>
        String(m._id || m.id) === targetId ? { ...m, ...updatedMsg } : m
      ),
    }));
  },

  removeMessage: (messageId, conversationId) => {
    if (!messageId) return;
    const targetId = String(messageId);
    set((state) => ({
      messages: state.messages.map((m) =>
        String(m._id || m.id) === targetId
          ? { ...m, isDeleted: true, content: 'This message was deleted', attachments: [] }
          : m
      ),
    }));
  },

  updateMessageStatus: (messageId, status, conversationId) => {
    set((state) => {
      let updatedMessages = state.messages;
      const targetConvId = conversationId ? String(conversationId) : null;
      const targetMsgId = messageId ? String(messageId) : null;

      if (targetConvId && status === 'read') {
        updatedMessages = updatedMessages.map((m) => {
          const mConvId = String(m.conversationId || m.conversation?._id || m.conversation || '');
          if (mConvId === targetConvId) {
            return { ...m, status: 'read' };
          }
          return m;
        });
      } else if (targetMsgId) {
        updatedMessages = updatedMessages.map((m) =>
          String(m._id || m.id) === targetMsgId ? { ...m, status } : m
        );
      } else if (targetConvId) {
        updatedMessages = updatedMessages.map((m) => {
          const mConvId = String(m.conversationId || m.conversation?._id || m.conversation || '');
          if (mConvId === targetConvId) {
            return { ...m, status };
          }
          return m;
        });
      }

      // Also update lastMessage in conversations list
      const updatedConversations = state.conversations.map((c) => {
        const cId = String(c._id || c.id);
        if (targetConvId && cId === targetConvId && c.lastMessage) {
          const lastMsgId = String(c.lastMessage._id || c.lastMessage.id || '');
          if (!targetMsgId || lastMsgId === targetMsgId || status === 'read') {
            return {
              ...c,
              lastMessage: {
                ...c.lastMessage,
                status,
              },
            };
          }
        }
        return c;
      });

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  },

  updateConversation: (conversation) => {
    if (!conversation) return;
    const targetId = conversation._id || conversation.id;
    set((state) => ({
      conversations: state.conversations.map((c) =>
        (c._id || c.id) === targetId ? { ...c, ...conversation } : c
      ),
      activeConversation:
        (state.activeConversation?._id || state.activeConversation?.id) === targetId
          ? { ...state.activeConversation, ...conversation }
          : state.activeConversation,
    }));
  },

  createConversation: async (data) => {
    try {
      const payload = {
        type: data.type || (data.recipientId || data.participantId ? 'private' : 'group'),
        recipientId: data.recipientId || data.participantId,
        participantIds: data.participantIds || [],
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        ...data,
      };

      const res = await api.post('/conversations', payload);
      const newConv = res.conversation || res;
      set((state) => ({
        conversations: [newConv, ...state.conversations.filter((c) => (c._id || c.id) !== (newConv._id || newConv.id))],
      }));
      return newConv;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      throw err;
    }
  },
}));

export default useChatStore;
