'use client';

import { useEffect, useRef, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import Spinner from '@/components/ui/Spinner';
import { formatSeparatorDate } from '@/lib/utils';
import { useSocketStore } from '@/stores/useSocketStore';
import { useChatStore } from '@/stores/useChatStore';
import { MessageSquareDashed } from 'lucide-react';

export default function MessageList({
  messages = [],
  isLoading = false,
  conversationId,
  isGroup = false,
  onReply,
  onDeleteMessage,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const prevScrollHeightRef = useRef(0);
  const isPrependingOlderRef = useRef(false);
  const prevFirstMsgIdRef = useRef(null);
  const prevLastMsgIdRef = useRef(null);

  const { typingUsers } = useSocketStore();
  const currentTypingList = typingUsers[conversationId] || [];

  const { hasMoreMessages, isLoadingMoreMessages, fetchMoreMessages } = useChatStore();

  // Group messages by calendar date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentGroup = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt || Date.now());
      const dateString = msgDate.toDateString();

      if (!currentGroup || currentGroup.dateString !== dateString) {
        currentGroup = {
          dateString,
          formattedDate: formatSeparatorDate(msgDate),
          messages: [],
        };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(msg);
    });

    return groups;
  }, [messages]);

  // Handle scroll position after prepending older messages vs adding new message
  useEffect(() => {
    if (!messages || messages.length === 0) {
      prevFirstMsgIdRef.current = null;
      prevLastMsgIdRef.current = null;
      return;
    }

    const currentFirstId = messages[0]?._id || messages[0]?.id;
    const currentLastId = messages[messages.length - 1]?._id || messages[messages.length - 1]?.id;

    // 1. Older messages prepended -> adjust scrollTop so view doesn't jump
    if (isPrependingOlderRef.current && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeightRef.current;
      containerRef.current.scrollTop += heightDifference;
      isPrependingOlderRef.current = false;
    }
    // 2. Initial load or new message appended at bottom -> smooth scroll
    else if (prevLastMsgIdRef.current !== currentLastId) {
      const isInitial = prevLastMsgIdRef.current === null;
      bottomRef.current?.scrollIntoView({ behavior: isInitial ? 'auto' : 'smooth' });
    }

    prevFirstMsgIdRef.current = currentFirstId;
    prevLastMsgIdRef.current = currentLastId;
  }, [messages]);

  // Scroll listener for top threshold to load older messages
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight } = e.currentTarget;
    if (scrollTop < 80 && hasMoreMessages && !isLoadingMoreMessages && !isLoading && messages.length > 0) {
      prevScrollHeightRef.current = scrollHeight;
      isPrependingOlderRef.current = true;
      fetchMoreMessages(conversationId);
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/40"
    >
      {/* Top loader when fetching older messages */}
      {isLoadingMoreMessages && (
        <div className="flex items-center justify-center py-2 animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-zinc-800 rounded-full text-xs text-zinc-500 shadow-xs border border-zinc-200 dark:border-zinc-700">
            <Spinner size="xs" />
            <span>Loading older messages...</span>
          </div>
        </div>
      )}

      {/* Beginning of history marker */}
      {!hasMoreMessages && messages.length >= 30 && (
        <div className="text-center py-2 text-[11px] text-zinc-400 select-none">
          Beginning of message history
        </div>
      )}

      {/* Message Skeleton Loading state */}
      {isLoading && messages.length === 0 && (
        <div className="space-y-4 p-2 animate-fade-in">
          <div className="flex flex-col items-start space-y-1">
            <div className="w-56 h-14 rounded-2xl rounded-bl-xs skeleton-shimmer" />
          </div>
          <div className="flex flex-col items-end space-y-1 ml-auto">
            <div className="w-48 h-12 rounded-2xl rounded-br-xs skeleton-shimmer bg-emerald-100/50 dark:bg-emerald-950/30" />
          </div>
          <div className="flex flex-col items-start space-y-1">
            <div className="w-72 h-16 rounded-2xl rounded-bl-xs skeleton-shimmer" />
          </div>
          <div className="flex flex-col items-end space-y-1 ml-auto">
            <div className="w-64 h-12 rounded-2xl rounded-br-xs skeleton-shimmer bg-emerald-100/50 dark:bg-emerald-950/30" />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center text-zinc-400 select-none">
          <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-emerald-500 mb-3">
            <MessageSquareDashed className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            No messages yet
          </h4>
          <p className="text-xs text-zinc-500 max-w-xs mt-1">
            Say hello and start the conversation! Your messages are encrypted and private.
          </p>
        </div>
      )}

      {/* Grouped Messages */}
      {groupedMessages.map((group) => (
        <div key={group.dateString} className="space-y-3">
          {/* Date Separator Pill */}
          <div className="flex items-center justify-center my-3">
            <span className="text-[11px] font-medium bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full shadow-xs border border-zinc-200/60 dark:border-zinc-700/60 select-none">
              {group.formattedDate}
            </span>
          </div>

          {/* Messages within this date */}
          {group.messages.map((message) => (
            <MessageBubble
              key={message._id || message.id}
              message={message}
              isGroup={isGroup}
              onReply={onReply}
              onDelete={onDeleteMessage}
            />
          ))}
        </div>
      ))}

      {/* Typing indicator bubble */}
      {currentTypingList.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 pl-2 animate-fade-in">
          <div className="flex items-center gap-1 bg-zinc-200 dark:bg-zinc-800 px-3 py-2 rounded-2xl">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
          </div>
          <span className="italic text-[11px]">
            {currentTypingList.join(', ')} {currentTypingList.length > 1 ? 'are' : 'is'} typing...
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
