'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { useChatStore } from '@/stores/useChatStore';
import { WifiOff, Database, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConnectionBanner() {
  const { isOnline, isDatabaseDown, networkError, setIsOnline, setIsDatabaseDown, setNetworkError } =
    useUIStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setNetworkError(null);
      setShowRestoredToast(true);

      // Reconnect socket and refresh current state
      const socketStore = useSocketStore.getState();
      socketStore.connect();

      const chatStore = useChatStore.getState();
      chatStore.fetchConversations();
      const currentActiveId = chatStore.activeConversation?._id || chatStore.activeConversation?.id;
      if (currentActiveId) {
        chatStore.fetchMessages(currentActiveId);
      }

      toast.success('Connection restored! You are back online.', {
        icon: '⚡',
        duration: 3000,
      });

      const timer = setTimeout(() => setShowRestoredToast(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are currently offline. Check your internet connection.', {
        icon: '📡',
        duration: 4000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, setNetworkError]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (typeof navigator !== 'undefined') {
        setIsOnline(navigator.onLine);
      }

      const chatStore = useChatStore.getState();
      await chatStore.fetchConversations();

      const currentActiveId = chatStore.activeConversation?._id || chatStore.activeConversation?.id;
      if (currentActiveId) {
        await chatStore.fetchMessages(currentActiveId);
      }

      setIsDatabaseDown(false);
      setNetworkError(null);
      toast.success('Successfully reconnected to server');
    } catch {
      toast.error('Still unable to connect. Retrying in background...');
    } finally {
      setIsRetrying(false);
    }
  };

  if (isOnline && !isDatabaseDown && !networkError && !showRestoredToast) {
    return null;
  }

  // 1. Connection Restored Indicator
  if (showRestoredToast && isOnline && !isDatabaseDown && !networkError) {
    return (
      <div className="bg-emerald-600 text-white text-xs font-semibold py-1 px-4 flex items-center justify-center gap-2 select-none animate-fade-in shadow-xs z-50">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Back online! Reconnected to NexChat</span>
      </div>
    );
  }

  // 2. Offline Indicator
  if (!isOnline) {
    return (
      <div className="bg-rose-600 text-white text-xs font-semibold py-2 px-4 flex items-center justify-between gap-3 select-none animate-fade-in shadow-md z-50">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>You are currently offline. Check your internet connection.</span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Checking...' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  // 3. Database Down Indicator
  if (isDatabaseDown) {
    return (
      <div className="bg-amber-600 text-white text-xs font-semibold py-2 px-4 flex items-center justify-between gap-3 select-none animate-fade-in shadow-md z-50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 shrink-0 animate-pulse" />
          <span>Database service is temporarily unavailable. Data may be delayed.</span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Connecting...' : 'Reconnect'}</span>
        </button>
      </div>
    );
  }

  // 4. General Network Error Indicator
  if (networkError) {
    return (
      <div className="bg-amber-600 text-white text-xs font-semibold py-2 px-4 flex items-center justify-between gap-3 select-none animate-fade-in shadow-md z-50">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{networkError}</span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  return null;
}
