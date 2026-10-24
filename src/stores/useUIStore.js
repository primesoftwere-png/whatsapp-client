import { create } from 'zustand';

export const useUIStore = create((set, get) => ({
  theme: 'system', // 'light' | 'dark' | 'system'
  sidebarOpen: true,
  activeSidebarTab: 'chats', // 'chats' | 'contacts' | 'settings'
  isMobile: false,

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexchat-theme', theme);
      const isDark =
        theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  toggleTheme: () => {
    let isCurrentlyDark = false;
    if (typeof window !== 'undefined') {
      isCurrentlyDark = document.documentElement.classList.contains('dark');
    } else {
      isCurrentlyDark = get().theme === 'dark';
    }
    const next = isCurrentlyDark ? 'light' : 'dark';
    get().setTheme(next);
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  setIsMobile: (isMobile) => set({ isMobile }),

  // Network & Database status
  isOnline: true,
  isDatabaseDown: false,
  networkError: null,
  setIsOnline: (isOnline) => set({ isOnline }),
  setIsDatabaseDown: (isDatabaseDown) => set({ isDatabaseDown }),
  setNetworkError: (networkError) => set({ networkError }),
}));

export default useUIStore;
