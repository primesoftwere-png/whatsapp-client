'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useContactStore } from '@/stores/useContactStore';
import ConversationItem from './ConversationItem';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import { Plus, Users, MessageSquarePlus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConversationList() {
  const router = useRouter();
  const params = useParams();
  const activeId = params?.conversationId;

  const {
    conversations,
    isLoadingConversations,
    isLoadingMoreConversations,
    hasMoreConversations,
    fetchConversations,
    fetchMoreConversations,
    setActiveConversation,
    createConversation,
  } = useChatStore();

  const {
    contacts,
    fetchContacts,
    searchUsers,
    fetchMoreSearchUsers,
    searchResults,
    isLoadingSearch,
    isLoadingMoreSearch,
    hasMoreSearch,
  } = useContactStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'groups'
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchConversations(1, false);
    fetchContacts();
  }, [fetchConversations, fetchContacts]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 120) {
      if (hasMoreConversations && !isLoadingMoreConversations && !isLoadingConversations) {
        fetchMoreConversations();
      }
    }
  };

  const handleSearchScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 60) {
      if (hasMoreSearch && !isLoadingMoreSearch && !isLoadingSearch && userQuery.trim()) {
        fetchMoreSearchUsers(userQuery);
      }
    }
  };

  // Handle contact search debounce in modal
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userQuery.trim().length > 0) {
        searchUsers(userQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userQuery, searchUsers]);

  // Filter conversations based on query and tab
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // Filter tab
      if (filter === 'unread' && (!c.unreadCount || c.unreadCount === 0)) {
        return false;
      }
      if (filter === 'groups' && !c.isGroup) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const groupName = c.name?.toLowerCase() || '';
        const participantNames = (c.participants || [])
          .map((p) => (p.name || p.username || '').toLowerCase())
          .join(' ');
        const lastMsg = (c.lastMessage?.content || '').toLowerCase();

        return (
          groupName.includes(query) ||
          participantNames.includes(query) ||
          lastMsg.includes(query)
        );
      }

      return true;
    });
  }, [conversations, filter, search]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    const id = conversation._id || conversation.id;
    router.push(`/chats/${id}`);
  };

  const handleStartConversationWithUser = async (targetUser) => {
    setIsCreating(true);
    try {
      const conv = await createConversation({
        participantId: targetUser._id || targetUser.id,
      });
      setIsNewChatModalOpen(false);
      setUserQuery('');
      toast.success(`Chat started with ${targetUser.name || targetUser.username}`);
      const id = conv._id || conv.id;
      setActiveConversation(conv);
      router.push(`/chats/${id}`);
    } catch {
      toast.error('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 select-none">
      {/* Header */}
      <div className="p-4 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            Messages
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {conversations.length} conversation{conversations.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewChatModalOpen(true)}
          className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
          title="New Conversation"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="px-4 pb-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search chats or messages..."
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 px-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'groups', label: 'Groups' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === tab.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conversation Items List */}
      <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoadingConversations && conversations.length === 0 ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 p-3 rounded-2xl border border-transparent"
              >
                <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 rounded-md skeleton-shimmer w-28" />
                    <div className="h-2.5 rounded-md skeleton-shimmer w-10" />
                  </div>
                  <div className="h-3 rounded-md skeleton-shimmer w-44" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length > 0 ? (
          <>
            {filteredConversations.map((conv) => {
              const convId = conv._id || conv.id;
              return (
                <ConversationItem
                  key={convId}
                  conversation={conv}
                  isActive={String(convId) === String(activeId)}
                  onClick={() => handleSelectConversation(conv)}
                />
              );
            })}
            {isLoadingMoreConversations && (
              <div className="flex items-center justify-center py-3 gap-2 text-xs text-zinc-500">
                <Spinner size="xs" />
                <span>Loading more conversations...</span>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No conversations found
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-4">
              {search
                ? 'Try a different search term'
                : 'Start a new conversation with your contacts!'}
            </p>
            {!search && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsNewChatModalOpen(true)}
                icon={Plus}
              >
                Start Chat
              </Button>
            )}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => {
          setIsNewChatModalOpen(false);
          setUserQuery('');
        }}
        title="Start a new chat"
        description="Search for a contact or discover new users on NexChat"
      >
        <div className="space-y-4">
          <SearchInput
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onClear={() => setUserQuery('')}
            placeholder="Search by name or username..."
            autoFocus
          />

          <div onScroll={handleSearchScroll} className="max-h-64 overflow-y-auto space-y-1">
            {isLoadingSearch && searchResults.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-500">
                Searching users...
              </div>
            ) : userQuery.trim() ? (
              searchResults.length > 0 ? (
                <>
                  {searchResults.map((usr) => (
                    <div
                      key={usr._id || usr.id}
                      onClick={() => handleStartConversationWithUser(usr)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={usr.avatar}
                          name={usr.name || usr.username}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {usr.name || usr.username}
                          </p>
                          <p className="text-xs text-zinc-500">@{usr.username}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="secondary" disabled={isCreating}>
                        Message
                      </Button>
                    </div>
                  ))}
                  {isLoadingMoreSearch && (
                    <div className="py-2 text-center text-xs text-zinc-500">
                      Loading more users...
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No users found matching &ldquo;{userQuery}&rdquo;
                </div>
              )
            ) : contacts.length > 0 ? (
              <div>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 px-1">
                  Your Contacts
                </p>
                {contacts.map((c) => {
                  const contactUser = c.contact || c;
                  return (
                    <div
                      key={contactUser._id || contactUser.id}
                      onClick={() => handleStartConversationWithUser(contactUser)}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={contactUser.avatar}
                          name={contactUser.name || contactUser.username}
                          size="sm"
                        />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {contactUser.name || contactUser.username}
                          </p>
                          <p className="text-xs text-zinc-500">@{contactUser.username}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Chat
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-500">
                Type a username to find people on NexChat
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
