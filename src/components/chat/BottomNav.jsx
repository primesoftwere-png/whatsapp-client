'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, CircleDashed, Users, Settings } from 'lucide-react';
import { useChatStore } from '@/stores/useChatStore';
import { useContactStore } from '@/stores/useContactStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Avatar from '@/components/ui/Avatar';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const conversations = useChatStore((state) => state.conversations);
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const requests = useContactStore((state) => state.requests);
  const pendingRequestsCount = Array.isArray(requests)
    ? requests.filter((r) => r.status === 'pending').length
    : 0;

  const cleanPath = (pathname || '').replace(/\/$/, '') || '/';
  const isSpecificChat = cleanPath.startsWith('/chats/') && cleanPath !== '/chats';

  // Hide bottom navigation when inside a specific active conversation
  if (isSpecificChat) {
    return null;
  }

  const isChats = cleanPath === '/chats';
  const isStatus = cleanPath.startsWith('/status');
  const isContacts = cleanPath.startsWith('/contacts');
  const isSettings = cleanPath.startsWith('/settings');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] px-3 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none"
    >
      {/* 1. CHATS TAB */}
      <Link
        href="/chats"
        className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
          isChats
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
        }`}
      >
        <div className="relative">
          <MessageSquare className={`w-5 h-5 transition-transform ${isChats ? 'scale-110' : ''}`} />
          {totalUnread > 0 && (
            <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
        <span className="text-[11px] mt-1 tracking-tight">Chats</span>
        {isChats && (
          <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-emerald-500" />
        )}
      </Link>

      {/* 2. STATUS TAB (Replaced dark/light mode button) */}
      <Link
        href="/status"
        className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
          isStatus
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
        }`}
      >
        <div className="relative">
          <CircleDashed className={`w-5 h-5 transition-transform ${isStatus ? 'scale-110' : ''}`} />
        </div>
        <span className="text-[11px] mt-1 tracking-tight">Status</span>
        {isStatus && (
          <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-emerald-500" />
        )}
      </Link>

      {/* 3. CONTACTS TAB */}
      <Link
        href="/contacts"
        className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
          isContacts
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
        }`}
      >
        <div className="relative">
          <Users className={`w-5 h-5 transition-transform ${isContacts ? 'scale-110' : ''}`} />
          {pendingRequestsCount > 0 && (
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
          )}
        </div>
        <span className="text-[11px] mt-1 tracking-tight">Contacts</span>
        {isContacts && (
          <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-emerald-500" />
        )}
      </Link>

      {/* 4. SETTINGS & PROFILE TAB */}
      <Link
        href="/settings"
        className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
          isSettings
            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
            : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
        }`}
      >
        <div className="relative">
          {user?.avatar ? (
            <div className={`rounded-full p-0.5 ${isSettings ? 'ring-2 ring-emerald-500' : ''}`}>
              <Avatar src={user.avatar} name={user.name || user.username} size="xs" />
            </div>
          ) : (
            <Settings className={`w-5 h-5 transition-transform ${isSettings ? 'scale-110' : ''}`} />
          )}
        </div>
        <span className="text-[11px] mt-1 tracking-tight">Settings</span>
        {isSettings && (
          <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-emerald-500" />
        )}
      </Link>
    </nav>
  );
}
