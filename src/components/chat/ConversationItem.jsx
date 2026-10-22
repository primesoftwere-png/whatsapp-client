'use client';

import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore } from '@/stores/useSocketStore';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { formatDate, truncate } from '@/lib/utils';
import { Pin, VolumeX, Check, CheckCheck } from 'lucide-react';

export default function ConversationItem({
  conversation,
  isActive = false,
  onClick,
}) {
  const { user: currentUser } = useAuthStore();
  const onlineUsers = useSocketStore((state) => state.onlineUsers);

  if (!conversation) return null;

  // Determine display title and avatar
  let title = conversation.name || 'Chat';
  let avatarUrl = conversation.avatar || conversation.groupAvatar;
  let isOtherOnline = false;
  let otherUser = null;

  if (!conversation.isGroup && Array.isArray(conversation.participants)) {
    const foundParticipant = conversation.participants.find((p) => {
      const u = p.user || p;
      return String(u._id || u.id) !== String(currentUser?._id || currentUser?.id);
    });
    if (foundParticipant) {
      otherUser = foundParticipant.user || foundParticipant;
      title = otherUser.name || otherUser.username || 'User';
      avatarUrl = otherUser.avatar;
      const targetId = String(otherUser._id || otherUser.id);
      isOtherOnline = Boolean(onlineUsers && onlineUsers.has(targetId));
    }
  }

  const lastMsg = conversation.lastMessage;
  const lastMsgTime = lastMsg?.timestamp || lastMsg?.createdAt || conversation.updatedAt;
  const isSentByMe =
    lastMsg &&
    (String(lastMsg.sender?._id || lastMsg.sender?.id || lastMsg.sender) ===
      String(currentUser?._id || currentUser?.id));

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 ease-out select-none ${
        isActive
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 shadow-xs scale-[1.005]'
          : 'hover:bg-zinc-100/90 dark:hover:bg-zinc-800/60 border border-transparent hover:translate-x-0.5'
      }`}
    >
      {/* Avatar */}
      <Avatar
        src={avatarUrl}
        name={title}
        size="md"
        isOnline={isOtherOnline}
        showStatus={!conversation.isGroup}
      />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4
            className={`text-sm font-semibold truncate ${
              isActive
                ? 'text-emerald-950 dark:text-emerald-200'
                : 'text-zinc-900 dark:text-zinc-100'
            }`}
          >
            {title}
          </h4>
          {lastMsgTime && (
            <span
              className={`text-[11px] shrink-0 font-medium ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              {formatDate(lastMsgTime)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {isSentByMe && (
              <span className="shrink-0 text-zinc-400 dark:text-zinc-500">
                {lastMsg?.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500 inline" title="Seen" />
                ) : lastMsg?.status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 inline" title="Delivered" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 inline" title="Sent" />
                )}
              </span>
            )}
            <p className="truncate">
              {lastMsg ? truncate(lastMsg.content || (lastMsg.attachments?.length ? 'Attachment' : ''), 30) : 'Start chatting...'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {conversation.isMuted && (
              <VolumeX className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            )}
            {conversation.isPinned && (
              <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 rotate-45" />
            )}
            {conversation.unreadCount > 0 && (
              <Badge count={conversation.unreadCount} variant="primary" size="sm" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
