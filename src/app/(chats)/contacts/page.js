'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useContactStore } from '@/stores/useContactStore';
import { useChatStore } from '@/stores/useChatStore';
import ContactCard from '@/components/contacts/ContactCard';
import RequestCard from '@/components/contacts/RequestCard';
import SearchInput from '@/components/ui/SearchInput';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Spinner from '@/components/ui/Spinner';
import {
  Users,
  Compass,
  UserPlus,
  Inbox,
  Send,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' | 'discover' | 'requests'

  const {
    contacts,
    requests,
    searchResults,
    isLoadingContacts,
    isLoadingRequests,
    isLoadingSearch,
    isLoadingMoreSearch,
    hasMoreSearch,
    fetchContacts,
    fetchRequests,
    searchUsers,
    fetchMoreSearchUsers,
    sendRequest,
    acceptRequest,
    declineRequest,
    blockUser,
  } = useContactStore();

  const { createConversation, setActiveConversation } = useChatStore();

  const [discoverQuery, setDiscoverQuery] = useState('');
  const [contactsFilter, setContactsFilter] = useState('');

  useEffect(() => {
    fetchContacts();
    fetchRequests();
  }, [fetchContacts, fetchRequests]);

  // Debounced search for Discover tab
  useEffect(() => {
    const timer = setTimeout(() => {
      if (discoverQuery.trim()) {
        searchUsers(discoverQuery);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [discoverQuery, searchUsers]);

  const handleStartChat = async (targetUser) => {
    try {
      const conv = await createConversation({
        participantId: targetUser._id || targetUser.id,
      });
      setActiveConversation(conv);
      router.push(`/chats/${conv._id || conv.id}`);
    } catch {
      toast.error('Failed to open conversation');
    }
  };

  const handleSendRequest = async (recipientId) => {
    try {
      await sendRequest(recipientId);
      toast.success('Contact request sent!');
    } catch (err) {
      toast.error(err.message || 'Could not send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await acceptRequest(requestId);
      toast.success('Contact request accepted!');
    } catch {
      toast.error('Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await declineRequest(requestId);
      toast.success('Contact request declined');
    } catch {
      toast.error('Failed to decline request');
    }
  };

  const handleBlockUser = async (userId) => {
    if (confirm('Are you sure you want to block this user?')) {
      try {
        await blockUser(userId);
        toast.success('User blocked');
      } catch {
        toast.error('Failed to block user');
      }
    }
  };

  // Filter contacts by search string
  const filteredContacts = contacts.filter((c) => {
    const u = c.contact || c;
    const name = (u.name || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const query = contactsFilter.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden">
      {/* Top Header */}
      <div className="p-6 pb-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              Contacts & Discovery
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Manage your connections and discover people across NexChat
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              My Contacts ({contacts.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('discover')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'discover'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Discover
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'requests'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              Requests ({requests.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto">
          {/* TAB 1: MY CONTACTS */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              <div className="max-w-md">
                <SearchInput
                  value={contactsFilter}
                  onChange={(e) => setContactsFilter(e.target.value)}
                  onClear={() => setContactsFilter('')}
                  placeholder="Filter your contacts..."
                />
              </div>

              {isLoadingContacts ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" text="Loading contacts..." />
                </div>
              ) : filteredContacts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredContacts.map((c) => (
                    <ContactCard
                      key={c._id || c.id}
                      contact={c}
                      onMessage={handleStartChat}
                      onBlock={handleBlockUser}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-md mx-auto">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4">
                    <UserPlus className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    No contacts yet
                  </h3>
                  <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                    Search and discover people across NexChat using their unique username to grow your circle.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setActiveTab('discover')}
                    icon={Compass}
                  >
                    Find People
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISCOVER */}
          {activeTab === 'discover' && (
            <div className="space-y-6">
              <div className="max-w-xl">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Find new connections
                </h3>
                <SearchInput
                  value={discoverQuery}
                  onChange={(e) => setDiscoverQuery(e.target.value)}
                  onClear={() => setDiscoverQuery('')}
                  placeholder="Type a username or name (e.g. alex, sarah)..."
                  autoFocus
                />
              </div>

              {isLoadingSearch ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" text="Searching NexChat directory..." />
                </div>
              ) : discoverQuery.trim() ? (
                searchResults.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {searchResults.map((usr) => (
                      <div
                        key={usr._id || usr.id}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={usr.avatar}
                            name={usr.name || usr.username}
                            size="lg"
                          />
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                              {usr.name || usr.username}
                            </h4>
                            <p className="text-xs text-zinc-500 truncate">
                              @{usr.username}
                            </p>
                            {usr.bio && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate mt-1">
                                {usr.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-4">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleSendRequest(usr._id || usr.id)}
                            icon={UserPlus}
                          >
                            Connect
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {hasMoreSearch && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchMoreSearchUsers(discoverQuery)}
                        isLoading={isLoadingMoreSearch}
                      >
                        Load more users
                      </Button>
                    </div>
                  )}
                  </>
                ) : (
                  <div className="text-center py-12 text-xs text-zinc-500">
                    No users found matching &ldquo;{discoverQuery}&rdquo;. Check spelling or try a different keyword.
                  </div>
                )
              ) : (
                <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center max-w-lg mx-auto">
                  <Compass className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Discover People
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Search above by @username to send contact requests. NexChat lets you connect securely without ever exposing personal phone numbers.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {isLoadingRequests ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" text="Loading contact requests..." />
                </div>
              ) : requests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {requests.map((req) => (
                    <RequestCard
                      key={req._id || req.id}
                      request={req}
                      onAccept={handleAcceptRequest}
                      onDecline={handleDeclineRequest}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-md mx-auto">
                  <Inbox className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    No pending requests
                  </h3>
                  <p className="text-xs text-zinc-500">
                    When someone invites you to connect, their request will appear here for you to accept or decline.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
