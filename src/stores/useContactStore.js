import { create } from 'zustand';
import api from '@/lib/api';

export const useContactStore = create((set, get) => ({
  contacts: [],
  requests: [],
  incomingRequests: [],
  outgoingRequests: [],
  blockedUsers: [],
  searchResults: [],
  isLoadingContacts: false,
  isLoadingRequests: false,
  isLoadingSearch: false,
  isLoadingBlocks: false,

  fetchContacts: async () => {
    set({ isLoadingContacts: true });
    try {
      const data = await api.get('/users/contacts');
      const contacts = Array.isArray(data) ? data : data.contacts || [];
      set({ contacts, isLoadingContacts: false });
      return contacts;
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
      set({ contacts: [], isLoadingContacts: false });
      return [];
    }
  },

  fetchRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const data = await api.get('/contact-requests');
      const incoming = Array.isArray(data?.incoming) ? data.incoming : [];
      const outgoing = Array.isArray(data?.outgoing) ? data.outgoing : [];
      const requests = [
        ...incoming.map((r) => ({ ...r, isIncoming: true })),
        ...outgoing.map((r) => ({ ...r, isOutgoing: true })),
      ];
      set({
        requests,
        incomingRequests: incoming,
        outgoingRequests: outgoing,
        isLoadingRequests: false,
      });
      return requests;
    } catch (err) {
      console.error('Failed to fetch contact requests:', err);
      set({ requests: [], incomingRequests: [], outgoingRequests: [], isLoadingRequests: false });
      return [];
    }
  },

  searchPage: 1,
  hasMoreSearch: false,
  isLoadingMoreSearch: false,

  searchUsers: async (query, page = 1, append = false) => {
    if (!query || query.trim().length === 0) {
      set({ searchResults: [], isLoadingSearch: false, hasMoreSearch: false, searchPage: 1 });
      return [];
    }
    if (page === 1) {
      set({ isLoadingSearch: true, searchPage: 1 });
    } else {
      set({ isLoadingMoreSearch: true });
    }

    try {
      const q = encodeURIComponent(query.trim());
      const data = await api.get(`/users/search?query=${q}&q=${q}&page=${page}&limit=20`);
      const results = Array.isArray(data) ? data : data.users || [];
      const totalPages = data.pagination?.pages || 1;
      const hasMore = page < totalPages;

      set((state) => {
        let combined;
        if (append) {
          const existingIds = new Set(state.searchResults.map((u) => String(u._id || u.id)));
          const filteredNew = results.filter((u) => !existingIds.has(String(u._id || u.id)));
          combined = [...state.searchResults, ...filteredNew];
        } else {
          combined = results;
        }
        return {
          searchResults: combined,
          searchPage: page,
          hasMoreSearch: hasMore,
          isLoadingSearch: false,
          isLoadingMoreSearch: false,
        };
      });
      return results;
    } catch (err) {
      console.error('Failed to search users:', err);
      set({ searchResults: [], isLoadingSearch: false, isLoadingMoreSearch: false });
      return [];
    }
  },

  fetchMoreSearchUsers: async (query) => {
    const { searchPage, hasMoreSearch, isLoadingSearch, isLoadingMoreSearch } = get();
    if (!hasMoreSearch || isLoadingSearch || isLoadingMoreSearch) return;
    return get().searchUsers(query, searchPage + 1, true);
  },

  sendRequest: async (recipientId, message = '') => {
    try {
      const res = await api.post('/contact-requests', {
        toUserId: recipientId,
        recipientId,
        message,
      });
      get().fetchRequests();
      return res;
    } catch (err) {
      console.error('Failed to send contact request:', err);
      throw err;
    }
  },

  acceptRequest: async (requestId) => {
    try {
      const res = await api.patch(`/contact-requests/${requestId}/accept`, {});
      // Refresh both contacts and requests
      get().fetchContacts();
      get().fetchRequests();
      return res;
    } catch (err) {
      console.error('Failed to accept request:', err);
      throw err;
    }
  },

  declineRequest: async (requestId) => {
    try {
      const res = await api.patch(`/contact-requests/${requestId}/decline`, {});
      get().fetchRequests();
      return res;
    } catch (err) {
      console.error('Failed to decline request:', err);
      throw err;
    }
  },

  fetchBlockedUsers: async () => {
    set({ isLoadingBlocks: true });
    try {
      const data = await api.get('/blocks');
      const blocks = Array.isArray(data) ? data : data.blocks || [];
      set({ blockedUsers: blocks, isLoadingBlocks: false });
      return blocks;
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
      set({ blockedUsers: [], isLoadingBlocks: false });
      return [];
    }
  },

  blockUser: async (userId) => {
    try {
      const res = await api.post('/blocks', { userId });
      get().fetchBlockedUsers();
      get().fetchContacts();
      return res;
    } catch (err) {
      console.error('Failed to block user:', err);
      throw err;
    }
  },

  unblockUser: async (userId) => {
    try {
      const res = await api.delete(`/blocks/${userId}`);
      get().fetchBlockedUsers();
      return res;
    } catch (err) {
      console.error('Failed to unblock user:', err);
      throw err;
    }
  },
}));

export default useContactStore;
