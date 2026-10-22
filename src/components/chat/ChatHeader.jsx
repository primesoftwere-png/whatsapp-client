'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { useCallStore } from '@/stores/useCallStore';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Search,
  BellOff,
  UserX,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatHeader({ conversation, onSearchClick }) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const onlineUsers = useSocketStore((state) => state.onlineUsers);
  const typingUsers = useSocketStore((state) => state.typingUsers);
  const { startCall } = useCallStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!conversation) return null;

  const convId = conversation._id || conversation.id;
  const isGroup = conversation.isGroup;

  let title = conversation.name || 'Chat';
  let avatarUrl = conversation.avatar || conversation.groupAvatar;
  let otherUser = null;
  let isOnline = false;

  if (!isGroup && Array.isArray(conversation.participants)) {
    const foundParticipant = conversation.participants.find((p) => {
      const u = p.user || p;
      return String(u._id || u.id) !== String(currentUser?._id || currentUser?.id);
    });
    if (foundParticipant) {
      otherUser = foundParticipant.user || foundParticipant;
      title = otherUser.name || otherUser.username || 'User';
      avatarUrl = otherUser.avatar;
      const targetId = String(otherUser._id || otherUser.id);
      isOnline = Boolean(onlineUsers && onlineUsers.has(targetId));
    }
  }

  // Check typing state for this conversation
  const currentTypingList = typingUsers[convId] || [];
  const isTyping = currentTypingList.length > 0;

  const handleMute = () => {
    setShowMenu(false);
    toast.success('Conversation muted');
  };

  const handleVoiceCall = () => {
    if (isGroup) {
      toast.error('Group voice calls are coming soon');
      return;
    }
    if (!otherUser) {
      toast.error('Cannot initiate call');
      return;
    }
    if (!isOnline) {
      toast(`${title} is currently offline and cannot receive calls`, { icon: '📞' });
      return;
    }
    startCall(convId, otherUser, 'audio');
  };

  const handleVideoCall = () => {
    if (isGroup) {
      toast.error('Group video calls are coming soon');
      return;
    }
    if (!otherUser) {
      toast.error('Cannot initiate call');
      return;
    }
    if (!isOnline) {
      toast(`${title} is currently offline and cannot receive calls`, { icon: '📹' });
      return;
    }
    startCall(convId, otherUser, 'video');
  };

  return (
    <div className="relative flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-20">
      {/* Left: Back button & User details */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/chats')}
          className="p-1.5 -ml-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl md:hidden"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={() => setShowProfileModal(true)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <Avatar
            src={avatarUrl}
            name={title}
            size="md"
            isOnline={isOnline}
            showStatus={!isGroup}
          />
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              {isTyping ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                  typing...
                </span>
              ) : isGroup ? (
                `${conversation.participants?.length || 0} members`
              ) : isOnline ? (
                <span className="text-emerald-500 font-medium">Online</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {onSearchClick && (
          <button
            type="button"
            onClick={onSearchClick}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            title="Search in conversation"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={handleVoiceCall}
          className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          title={`Call ${title}`}
        >
          <Phone className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleVideoCall}
          className="p-2 text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          title={`Video Call ${title}`}
        >
          <Video className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl py-1.5 z-50 animate-fade-in text-sm">
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  setShowProfileModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
              >
                <Info className="w-4 h-4 text-zinc-400" />
                Contact Info
              </button>
              <button
                type="button"
                onClick={handleMute}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left"
              >
                <BellOff className="w-4 h-4 text-zinc-400" />
                Mute Notifications
              </button>
              <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  toast.error('User blocked');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-left"
              >
                <UserX className="w-4 h-4 text-red-500" />
                Block Contact
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Detail Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Contact Details"
      >
        <div className="flex flex-col items-center text-center p-2">
          <Avatar
            src={avatarUrl}
            name={title}
            size="2xl"
            isOnline={isOnline}
            showStatus={!isGroup}
            className="mb-4 shadow-lg ring-4 ring-emerald-50 dark:ring-emerald-950/40"
          />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
          {otherUser?.username && (
            <p className="text-sm text-zinc-500 mb-2">@{otherUser.username}</p>
          )}
          {otherUser?.bio && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-3 rounded-xl w-full text-left mt-2">
              {otherUser.bio}
            </p>
          )}

          <div className="w-full mt-6 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              icon={BellOff}
              onClick={handleMute}
            >
              Mute Notifications
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
