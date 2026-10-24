import { create } from 'zustand';
import api from '@/lib/api';
import { useAuthStore } from './useAuthStore';
import toast from 'react-hot-toast';

export const useStatusStore = create((set, get) => ({
  myStatuses: [],
  otherStatuses: [],
  isLoading: false,
  isUploading: false,
  activeStoryGroup: null, // { user, statuses }
  activeStoryIndex: 0,
  isViewerOpen: false,

  fetchStatuses: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/status');
      if (res?.success) {
        set({
          myStatuses: res.myStatuses || [],
          otherStatuses: res.otherStatuses || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch statuses:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createStatus: async (formData) => {
    set({ isUploading: true });
    try {
      const res = await api.post('/status', formData);
      if (res?.success && res.status) {
        set((state) => ({
          myStatuses: [res.status, ...state.myStatuses],
        }));
        toast.success('Status posted successfully!');
        return res.status;
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload status');
      throw err;
    } finally {
      set({ isUploading: false });
    }
  },

  deleteStatus: async (statusId) => {
    try {
      const res = await api.delete(`/status/${statusId}`);
      if (res?.success) {
        set((state) => {
          const updatedMy = state.myStatuses.filter((s) => s._id !== statusId);

          // If currently viewing in story viewer
          if (state.activeStoryGroup) {
            const remaining = state.activeStoryGroup.statuses.filter((s) => s._id !== statusId);
            if (remaining.length === 0) {
              return {
                myStatuses: updatedMy,
                isViewerOpen: false,
                activeStoryGroup: null,
                activeStoryIndex: 0,
              };
            } else {
              const newIndex = Math.min(state.activeStoryIndex, remaining.length - 1);
              return {
                myStatuses: updatedMy,
                activeStoryGroup: { ...state.activeStoryGroup, statuses: remaining },
                activeStoryIndex: newIndex,
              };
            }
          }

          return { myStatuses: updatedMy };
        });
        toast.success('Status deleted');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete status');
    }
  },

  toggleLike: async (statusId) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return;
    const currentUserId = currentUser._id;

    // Helper to update a status like array
    const updateStatusLike = (status) => {
      if (status._id !== statusId) return status;
      const likes = Array.isArray(status.likes) ? [...status.likes] : [];
      const alreadyLiked = likes.some(
        (l) => (l._id || l).toString() === currentUserId.toString()
      );
      let newLikes;
      if (alreadyLiked) {
        newLikes = likes.filter(
          (l) => (l._id || l).toString() !== currentUserId.toString()
        );
      } else {
        newLikes = [
          ...likes,
          { _id: currentUserId, name: currentUser.name, avatar: currentUser.avatar },
        ];
      }
      return { ...status, likes: newLikes };
    };

    // Optimistic local update
    set((state) => {
      const updatedMy = state.myStatuses.map(updateStatusLike);
      const updatedOthers = state.otherStatuses.map((group) => ({
        ...group,
        statuses: group.statuses.map(updateStatusLike),
      }));

      let updatedActiveGroup = state.activeStoryGroup;
      if (updatedActiveGroup) {
        updatedActiveGroup = {
          ...updatedActiveGroup,
          statuses: updatedActiveGroup.statuses.map(updateStatusLike),
        };
      }

      return {
        myStatuses: updatedMy,
        otherStatuses: updatedOthers,
        activeStoryGroup: updatedActiveGroup,
      };
    });

    try {
      const res = await api.post(`/status/${statusId}/like`);
      if (res?.success && res.likes) {
        const syncServerLike = (status) => {
          if (status._id !== statusId) return status;
          return { ...status, likes: res.likes };
        };
        set((state) => ({
          myStatuses: state.myStatuses.map(syncServerLike),
          otherStatuses: state.otherStatuses.map((group) => ({
            ...group,
            statuses: group.statuses.map(syncServerLike),
          })),
        }));
      }
    } catch (err) {
      console.error('Failed to like status:', err);
      get().fetchStatuses();
    }
  },

  openViewer: (group, index = 0) => {
    set({
      activeStoryGroup: group,
      activeStoryIndex: index,
      isViewerOpen: true,
    });
    if (group?.statuses?.[index]?._id) {
      api.post(`/status/${group.statuses[index]._id}/view`).catch(() => {});
    }
  },

  closeViewer: () => {
    set({
      isViewerOpen: false,
      activeStoryGroup: null,
      activeStoryIndex: 0,
    });
  },

  setActiveIndex: (index) => {
    set({ activeStoryIndex: index });
    const group = get().activeStoryGroup;
    if (group?.statuses?.[index]?._id) {
      api.post(`/status/${group.statuses[index]._id}/view`).catch(() => {});
    }
  },

  handleSocketNewStatus: (newStatus) => {
    const currentUserId = useAuthStore.getState().user?._id;
    if (!newStatus || !newStatus.user) return;

    if (currentUserId && newStatus.user._id.toString() === currentUserId.toString()) {
      set((state) => {
        if (state.myStatuses.some((s) => s._id === newStatus._id)) return state;
        return { myStatuses: [newStatus, ...state.myStatuses] };
      });
    } else {
      set((state) => {
        const authorId = newStatus.user._id.toString();
        const existingGroupIndex = state.otherStatuses.findIndex(
          (g) => g.user._id.toString() === authorId
        );

        if (existingGroupIndex !== -1) {
          const updatedOthers = [...state.otherStatuses];
          const group = { ...updatedOthers[existingGroupIndex] };
          if (!group.statuses.some((s) => s._id === newStatus._id)) {
            group.statuses = [newStatus, ...group.statuses];
            group.latestStatusAt = newStatus.createdAt;
          }
          updatedOthers.splice(existingGroupIndex, 1);
          return { otherStatuses: [group, ...updatedOthers] };
        } else {
          return {
            otherStatuses: [
              {
                user: newStatus.user,
                latestStatusAt: newStatus.createdAt,
                statuses: [newStatus],
              },
              ...state.otherStatuses,
            ],
          };
        }
      });
    }
  },

  handleSocketDeleteStatus: ({ statusId }) => {
    set((state) => ({
      myStatuses: state.myStatuses.filter((s) => s._id !== statusId),
      otherStatuses: state.otherStatuses
        .map((g) => ({
          ...g,
          statuses: g.statuses.filter((s) => s._id !== statusId),
        }))
        .filter((g) => g.statuses.length > 0),
    }));
  },

  handleSocketLikeStatus: ({ statusId, likes }) => {
    const syncServerLike = (status) => {
      if (status._id !== statusId) return status;
      return { ...status, likes };
    };
    set((state) => ({
      myStatuses: state.myStatuses.map(syncServerLike),
      otherStatuses: state.otherStatuses.map((group) => ({
        ...group,
        statuses: group.statuses.map(syncServerLike),
      })),
    }));
  },
}));
