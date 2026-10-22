'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/stores/useUIStore';
import { useSocketStore } from '@/stores/useSocketStore';
import { useChatStore } from '@/stores/useChatStore';
import { getApiBaseUrl } from '@/lib/api';
import { WifiOff, Database, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConnectionBanner() {
  const pathname = usePathname();
  const { isOnline, isDatabaseDown, networkError, setIsOnline, setIsDatabaseDown, setNetworkError } =
    useUIStore();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRestoredToast, setShowRestoredToast] = useState(false);

  // Do not show the persistent banner on unauthenticated public marketing/auth pages
  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

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

      const timer = setTimeout(() => setShowRestoredToast(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      // Only trigger if browser explicitly reports navigator.onLine is false
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setIsOnline(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check on mount - never assume offline if navigator reports true
    if (typeof navigator !== 'undefined') {
      if (navigator.onLine === false) {
        setIsOnline(false);
      } else {
        setIsOnline(true);
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOnline, setNetworkError]);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Optimistically restore online status
    setIsOnline(true);
    setNetworkError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/health`).catch(() => null);

      if (res && res.ok) {
        setIsOnline(true);
        setIsDatabaseDown(false);
        setNetworkError(null);

        const socketStore = useSocketStore.getState();
        socketStore.connect();

        const chatStore = useChatStore.getState();
        chatStore.fetchConversations();

        toast.success('Reconnected to messaging server');
        return;
      }

      // If health check gave a response but degraded db
      if (res && res.status === 503) {
        setIsDatabaseDown(true);
      }
    } catch {
      // Keep optimistic online if user's browser is online
      if (typeof navigator !== 'undefined' && navigator.onLine !== false) {
        setIsOnline(true);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // If on public pages, do not render the banner
  if (isPublicPage) {
    return null;
  }

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

  // 2. Offline Indicator (Only if device is genuinely disconnected from the internet)
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
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors cursor-pointer"
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
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors cursor-pointer"
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
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  return null;
}
