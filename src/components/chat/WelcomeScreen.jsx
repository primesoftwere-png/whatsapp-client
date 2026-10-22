'use client';

import { MessageCircleCode, ShieldCheck, Zap, Lock } from 'lucide-react';

export default function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/60 dark:bg-zinc-950/40 text-center select-none h-full animate-fade-in">
      <div className="max-w-md flex flex-col items-center">
        {/* Glowing Logo Icon */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse-glow" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 hover:scale-105 transition-transform duration-300">
            <MessageCircleCode className="w-10 h-10" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Welcome to NexChat
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Select a conversation from the sidebar or start a new chat to begin messaging with your friends, team, or contacts.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 w-full text-left">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:scale-[1.02] hover:shadow-xs transition-all duration-200">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mb-1">
              <Zap className="w-4 h-4" />
              <span>Real-Time</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Instant delivery with typing indicators and read receipts.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-xs hover:scale-[1.02] hover:shadow-xs transition-all duration-200">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Private & Safe</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Full control over privacy, blocks, and online visibility.
            </p>
          </div>
        </div>

        {/* Footer Security Notice */}
        <div className="flex items-center gap-2 mt-10 text-[11px] text-zinc-400 dark:text-zinc-600 font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Conversations without boundaries</span>
        </div>
      </div>
    </div>
  );
}
