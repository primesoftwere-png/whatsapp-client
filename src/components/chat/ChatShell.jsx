'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import Sidebar from '@/components/chat/Sidebar';
import ConversationList from '@/components/chat/ConversationList';
import BottomNav from '@/components/chat/BottomNav';
import Spinner from '@/components/ui/Spinner';

export default function ChatShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, authChecked, authError, checkAuth } = useAuthStore();

  useEffect(() => {
    // Only redirect to login when auth check genuinely finished, user is definitely not logged in,
    // and the failure was not due to an offline/db connectivity failure.
    if (authChecked && !isLoading && !isAuthenticated && !authError) {
      router.push('/login');
    }
  }, [authChecked, isLoading, isAuthenticated, authError, router]);

  // Determine visibility states for mobile using sanitized path
  const cleanPath = (pathname || '').replace(/\/$/, '') || '/';
  const isChatsRoot = cleanPath === '/chats';
  const isSpecificChat = cleanPath.startsWith('/chats/') && cleanPath !== '/chats';
  const isContactsOrSettings = cleanPath.startsWith('/contacts') || cleanPath.startsWith('/settings');

  return (
    <div className="relative flex h-screen h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-white dark:bg-zinc-950">
      {/* Full screen loader while checking authentication */}
      {isLoading && !authChecked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#0c0c11]">
          <Spinner size="lg" text="Loading NexChat..." />
        </div>
      )}

      {/* Connectivity error barrier when auth failed due to offline/db-down */}
      {!isAuthenticated && authError && !isLoading && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-950 text-center">
          <div className="max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Connection Problem
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              {authError}
            </p>
            <button
              type="button"
              onClick={() => checkAuth()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* 1. Left Nav Sidebar - Hidden on mobile view, shown on desktop (md:flex) */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* 2. Middle Panel: Conversation List - Takes full width on mobile /chats, hidden on specific chat or contacts/settings */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
          isSpecificChat || isContactsOrSettings ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ConversationList />
      </div>

      {/* 3. Right Panel: Active Chat / Welcome Screen / Contacts / Settings */}
      <main
        className={`flex-1 h-full flex flex-col min-w-0 ${
          isChatsRoot ? 'hidden md:flex' : 'flex'
        }`}
      >
        {children}
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Hidden on md screens & during active chats) */}
      <BottomNav />
    </div>
  );
}
