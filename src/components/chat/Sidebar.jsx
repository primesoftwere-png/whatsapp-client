'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageSquare, Users, Settings, Sun, Moon, LogOut, MessageCircleCode } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useChatStore } from '@/stores/useChatStore';
import Avatar from '@/components/ui/Avatar';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const conversations = useChatStore((state) => state.conversations);
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to logout');
    }
  };

  const navItems = [
    {
      name: 'Chats',
      href: '/chats',
      icon: MessageSquare,
      isActive: pathname.startsWith('/chats'),
    },
    {
      name: 'Contacts',
      href: '/contacts',
      icon: Users,
      isActive: pathname.startsWith('/contacts'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      isActive: pathname.startsWith('/settings'),
    },
  ];

  return (
    <aside className="hidden md:flex w-16 md:w-18 flex-col items-center justify-between py-4 bg-zinc-900 text-zinc-300 border-r border-zinc-800 z-30 select-none shrink-0 h-full">
      {/* Top Logo */}
      <div className="flex flex-col items-center gap-6">
        <Link
          href="/chats"
          className="relative group p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 hover:scale-105 transition-transform duration-200"
          title="NexChat"
        >
          <MessageCircleCode className="w-6 h-6" />
        </Link>

        {/* Navigation items */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative p-3 rounded-xl transition-all duration-200 ease-out active:scale-95 group ${
                  item.isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-[1.05]'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />

                {item.name === 'Chats' && totalUnread > 0 && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}

                {/* Tooltip on hover */}
                <span className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-md">
                  {item.name}
                </span>

                {item.isActive && (
                  <span className="absolute -left-1 top-2.5 bottom-2.5 w-1 bg-emerald-400 rounded-r-full hidden md:block" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title={`Theme: ${theme}`}
        >
          {theme === 'dark' ? <Moon className="w-5 h-5 text-emerald-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* User Avatar */}
        <Link
          href="/settings"
          className="relative group cursor-pointer hover:ring-2 hover:ring-emerald-500 rounded-full transition-all"
          title={user?.name || user?.username || 'My Profile'}
        >
          <Avatar
            src={user?.avatar}
            name={user?.name || user?.username || 'You'}
            size="sm"
            isOnline={true}
            showStatus={true}
          />
        </Link>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
