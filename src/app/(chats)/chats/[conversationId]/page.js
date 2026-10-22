'use client';

import { useEffect, useState, use } from 'react';
import { useParams } from 'next/navigation';
import { useChatStore } from '@/stores/useChatStore';
import { useSocketStore } from '@/stores/useSocketStore';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageList from '@/components/chat/MessageList';
import MessageComposer from '@/components/chat/MessageComposer';
import Spinner from '@/components/ui/Spinner';
import toast from 'react-hot-toast';

export default function ActiveChatPage({ params: paramsPromise }) {
  // Support Next.js 15+ promise params or useParams
  const unwrappedParams = paramsPromise ? use(paramsPromise) : useParams();
  const conversationId = unwrappedParams?.conversationId;

  const {
    activeConversation,
    conversations,
    messages,
    isLoadingMessages,
    fetchMessages,
    fetchConversation,
    sendMessage,
    setActiveConversation,
  } = useChatStore();

  const { joinConversation, leaveConversation } = useSocketStore();

  const [replyingTo, setReplyingTo] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Fetch conversation metadata and messages when conversationId changes or on page refresh
  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;
    setLoadError(null);

    const loadChat = async () => {
      try {
        // Fetch conversation metadata directly from API so page refresh works reliably
        await fetchConversation(conversationId);
        if (isMounted) {
          await fetchMessages(conversationId);
          joinConversation(conversationId);
          useChatStore.getState().markConversationRead(conversationId);
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err.message || 'Failed to load conversation');
        }
      }
    };

    loadChat();

    return () => {
      isMounted = false;
      leaveConversation(conversationId);
    };
  }, [conversationId, fetchConversation, fetchMessages, joinConversation, leaveConversation]);

  // Sync activeConversation from sidebar conversations list if it has newer data
  useEffect(() => {
    if (!conversationId || conversations.length === 0) return;

    const existing = conversations.find(
      (c) => String(c._id || c.id) === String(conversationId)
    );
    if (existing && (!activeConversation || (existing.updatedAt && existing.updatedAt !== activeConversation.updatedAt))) {
      setActiveConversation(existing);
    }
  }, [conversationId, conversations, activeConversation, setActiveConversation]);

  const handleSendMessage = async (payload) => {
    try {
      await sendMessage(conversationId, payload);
      setReplyingTo(null);
    } catch {
      toast.error('Failed to send message');
    }
  };

  const handleDeleteMessage = (messageId) => {
    toast('Message deleted', { icon: '🗑️' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
      {/* 1. Header */}
      <ChatHeader
        conversation={activeConversation}
      />

      {/* 2. Scrollable Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoadingMessages}
        conversationId={conversationId}
        isGroup={activeConversation?.isGroup}
        onReply={(msg) => setReplyingTo(msg)}
        onDeleteMessage={handleDeleteMessage}
      />

      {/* 3. Composer */}
      <MessageComposer
        conversationId={conversationId}
        onSendMessage={handleSendMessage}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
