'use client';

import { useState, useEffect } from 'react';
import {
  CircleDashed,
  Plus,
  Image,
  Video,
  Heart,
  Trash2,
  Eye,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useStatusStore } from '@/stores/useStatusStore';
import { useAuthStore } from '@/stores/useAuthStore';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import CreateStatusModal from '@/components/status/CreateStatusModal';
import StoryViewer from '@/components/status/StoryViewer';
import { getMediaUrl, formatTime } from '@/lib/utils';

export default function StatusPage() {
  const { user: currentUser } = useAuthStore();
  const {
    myStatuses,
    otherStatuses,
    isLoading,
    fetchStatuses,
    openViewer,
    deleteStatus,
  } = useStatusStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showMyStatusesList, setShowMyStatusesList] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const hasMyStatus = myStatuses.length > 0;
  const latestMyStatus = hasMyStatus ? myStatuses[0] : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden">
      {/* Top Header */}
      <div className="p-6 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <CircleDashed className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin-slow" />
              Status Updates
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Photos and videos disappear after 24 hours
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Add Status</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* SECTION 1: MY STATUS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 px-1">
              My Status
            </h3>

            <div className="flex items-center justify-between gap-4 p-2 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
              <div
                className="flex items-center gap-4 flex-1 cursor-pointer"
                onClick={() => {
                  if (hasMyStatus) {
                    openViewer({ user: currentUser, statuses: myStatuses }, 0);
                  } else {
                    setIsModalOpen(true);
                  }
                }}
              >
                {/* Avatar with Story Ring or Plus Badge */}
                <div className="relative">
                  <div
                    className={`rounded-full p-0.5 ${
                      hasMyStatus
                        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                        : ''
                    }`}
                  >
                    <Avatar
                      src={currentUser?.avatar}
                      name={currentUser?.name || currentUser?.username}
                      size="lg"
                    />
                  </div>
                  {!hasMyStatus && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    My Status
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {hasMyStatus
                      ? `${myStatuses.length} ${myStatuses.length === 1 ? 'update' : 'updates'} • ${formatTime(
                          latestMyStatus.createdAt
                        )}`
                      : 'Tap to add status update'}
                  </p>
                </div>
              </div>

              {/* Action Buttons for My Status */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                  title="Add new update"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {hasMyStatus && (
                  <button
                    type="button"
                    onClick={() => setShowMyStatusesList((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {showMyStatusesList ? 'Hide' : 'Manage'}
                  </button>
                )}
              </div>
            </div>

            {/* Expanded My Statuses List (with Delete and Like count) */}
            {hasMyStatus && showMyStatusesList && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                <p className="text-[11px] font-semibold text-zinc-400 px-2">
                  Active Updates ({myStatuses.length})
                </p>
                {myStatuses.map((status, index) => {
                  const likesCount = Array.isArray(status.likes) ? status.likes.length : 0;
                  return (
                    <div
                      key={status._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() =>
                          openViewer({ user: currentUser, statuses: myStatuses }, index)
                        }
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 relative flex items-center justify-center">
                          {status.type === 'video' ? (
                            <>
                              <video
                                src={getMediaUrl(status.mediaUrl)}
                                className="w-full h-full object-cover"
                              />
                              <Video className="w-3.5 h-3.5 text-white absolute" />
                            </>
                          ) : (
                            <img
                              src={getMediaUrl(status.mediaUrl)}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                            {status.caption || (status.type === 'video' ? 'Video update' : 'Photo update')}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {formatTime(status.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-rose-500 font-semibold">
                          <Heart className="w-3.5 h-3.5 fill-rose-500" />
                          {likesCount}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('Delete this status update?')) {
                              deleteStatus(status._id);
                            }
                          }}
                          className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete status"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: RECENT UPDATES FROM OTHERS */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-3 px-1">
              Recent Updates
            </h3>

            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" text="Loading status updates..." />
              </div>
            ) : otherStatuses.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  No recent updates
                </h4>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  When your contacts share photos or videos, their status updates will appear right here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {otherStatuses.map((group) => {
                  const author = group.user || {};
                  const count = group.statuses.length;
                  const latest = group.statuses[0];

                  return (
                    <div
                      key={author._id}
                      onClick={() => openViewer(group, 0)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Avatar with Story Ring */}
                        <div className="relative">
                          <div className="rounded-full p-0.5 ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900">
                            <Avatar
                              src={author.avatar}
                              name={author.name || author.username}
                              size="md"
                            />
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {author.name || author.username}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {formatTime(group.latestStatusAt || latest?.createdAt)}
                            <span className="mx-1.5 opacity-60">•</span>
                            {count} {count === 1 ? 'update' : 'updates'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-400">
                        {latest?.type === 'video' ? (
                          <Video className="w-4 h-4 text-teal-500" />
                        ) : (
                          <Image className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Status Modal */}
      <CreateStatusModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Fullscreen Story Viewer */}
      <StoryViewer />
    </div>
  );
}
