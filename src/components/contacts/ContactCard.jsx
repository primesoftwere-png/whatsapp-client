'use client';

import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { useSocketStore } from '@/stores/useSocketStore';
import { MessageSquare, UserX, Phone, Video } from 'lucide-react';
import { useCallStore } from '@/stores/useCallStore';
import toast from 'react-hot-toast';

export default function ContactCard({
  contact,
  onMessage,
  onBlock,
}) {
  const onlineUsers = useSocketStore((state) => state.onlineUsers);
  const { startCall } = useCallStore();

  const user = contact?.contact || contact?.user || contact;
  const targetId = String(user?._id || user?.id || '');
  const isOnline = Boolean(targetId && onlineUsers && onlineUsers.has(targetId));

  const handleCall = () => {
    if (!user) return;
    if (!isOnline) {
      toast(`${user.name || user.username} is currently offline`, { icon: '📞' });
      return;
    }
    startCall(null, user, 'audio');
  };

  const handleVideoCall = () => {
    if (!user) return;
    if (!isOnline) {
      toast(`${user.name || user.username} is currently offline`, { icon: '📹' });
      return;
    }
    startCall(null, user, 'video');
  };

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-emerald-200 dark:hover:border-emerald-900/60 transition-all duration-200 ease-out hover:scale-[1.008] hover:shadow-xs">
      <div className="flex items-center gap-3.5 min-w-0">
        <Avatar
          src={user?.avatar}
          name={user?.name || user?.username}
          size="lg"
          isOnline={isOnline}
          showStatus={true}
        />
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {user?.name || user?.username}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            @{user?.username}
          </p>
          {user?.bio && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-xs mt-1">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 ml-4">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onMessage && onMessage(user)}
          icon={MessageSquare}
        >
          Message
        </Button>
        <button
          type="button"
          onClick={handleCall}
          className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
          title={`Voice Call ${user?.name || user?.username}`}
        >
          <Phone className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleVideoCall}
          className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
          title={`Video Call ${user?.name || user?.username}`}
        >
          <Video className="w-4 h-4" />
        </button>
        {onBlock && (
          <button
            type="button"
            onClick={() => onBlock(user._id || user.id)}
            className="p-2 text-zinc-400 hover:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="Block User"
          >
            <UserX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
