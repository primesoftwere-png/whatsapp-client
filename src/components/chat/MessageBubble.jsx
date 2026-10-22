'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatTime, getMediaUrl } from '@/lib/utils';
import { Check, CheckCheck, Reply, Copy, Trash2, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MessageBubble({
  message,
  onReply,
  onDelete,
  isGroup = false,
}) {
  const { user: currentUser } = useAuthStore();
  const [showActions, setShowActions] = useState(false);

  if (!message) return null;

  const senderId = message.sender?._id || message.sender?.id || message.sender;
  const currentUserId = currentUser?._id || currentUser?.id;
  const isSentByMe = String(senderId) === String(currentUserId);

  const senderName = message.sender?.name || message.sender?.username || 'Member';

  const copyContent = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`group relative flex flex-col mb-2.5 animate-message-in ${
        isSentByMe ? 'items-end' : 'items-start'
      }`}
    >
      {/* Sender name for group chats if incoming */}
      {isGroup && !isSentByMe && (
        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 ml-3 mb-1">
          {senderName}
        </span>
      )}

      <div className={`relative flex items-end gap-1.5 max-w-[85%] md:max-w-[70%]`}>
        {/* Floating action buttons on hover (Sent on left, Received on right) */}
        {isSentByMe && showActions && (
          <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 text-zinc-500 mb-1 animate-fade-in">
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className="p-1 hover:text-emerald-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={copyContent}
              className="p-1 hover:text-emerald-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message._id || message.id)}
                className="p-1 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Message Bubble Container */}
        <div
          className={`relative px-4 py-2.5 shadow-xs transition-shadow ${
            isSentByMe
              ? 'bg-[#10B981] text-white rounded-2xl rounded-br-xs'
              : 'bg-white dark:bg-zinc-800 text-[#1F2937] dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700 rounded-2xl rounded-bl-xs'
          }`}
        >
          {/* Reply Context if present */}
          {message.replyTo && (
            <div
              className={`mb-2 pl-2.5 py-1 text-xs border-l-2 rounded-r-lg ${
                isSentByMe
                  ? 'bg-emerald-700/50 border-white/70 text-emerald-50'
                  : 'bg-zinc-100 dark:bg-zinc-700/60 border-emerald-500 text-[#1F2937] dark:text-zinc-300'
              }`}
            >
              <p className="font-semibold text-[11px] truncate">
                {message.replyTo.sender?.name || 'Replied message'}
              </p>
              <p className="truncate opacity-80 text-[11px]">
                {message.replyTo.content || 'Attachment'}
              </p>
            </div>
          )}

          {/* Attachments / Images */}
          {Array.isArray(message.attachments) && message.attachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.attachments.map((att, index) => {
                const mediaUrl = getMediaUrl(att.url);
                return (
                  <div key={index} className="rounded-xl overflow-hidden max-w-sm">
                    {att.type?.startsWith('image') || att.url?.match(/\.(jpeg|jpg|gif|png|webp)/i) ? (
                      <img
                        src={mediaUrl}
                        alt="Attachment"
                        className="w-full max-h-72 object-cover rounded-xl hover:scale-101 transition-transform cursor-pointer"
                        onClick={() => window.open(mediaUrl, '_blank')}
                      />
                    ) : (
                      <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-black/10 hover:bg-black/20 text-xs font-medium"
                      >
                        📎 {att.name || 'Download Attachment'}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words select-text">
              {message.content}
            </p>
          )}

          {/* Time & Delivery Status */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
              isSentByMe ? 'text-emerald-100' : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            <span>{formatTime(message.createdAt)}</span>

            {isSentByMe && (
              <span className="shrink-0 ml-0.5">
                {message.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-200" title="Seen" />
                ) : message.status === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-100" title="Delivered" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-100" title="Sent" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Floating actions for received messages */}
        {!isSentByMe && showActions && (
          <div className="flex items-center gap-0.5 bg-white dark:bg-zinc-800 shadow-md border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 text-zinc-500 mb-1 animate-fade-in">
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                className="p-1 hover:text-emerald-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                title="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={copyContent}
              className="p-1 hover:text-emerald-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
