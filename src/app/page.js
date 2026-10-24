'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  MessageCircleCode,
  Zap,
  Users,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Globe,
  Smile,
  Send,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c0c11] text-zinc-900 dark:text-zinc-100 selection:bg-emerald-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -top-32 right-1/4 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-[#0c0c11]/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <MessageCircleCode className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-zinc-900 via-emerald-900 to-emerald-600 dark:from-white dark:via-zinc-200 dark:to-emerald-400 bg-clip-text text-transparent">
              NexChat
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link href="/chats">
                <Button variant="primary" size="sm" icon={ArrowRight} className="text-xs sm:text-sm">
                  Open NexChat
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium text-xs sm:text-sm px-2.5 sm:px-4">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="font-medium text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        {/* Release Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-8 animate-fade-in shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Next-Generation Messaging Experience</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6 max-w-4xl">
          Conversations{' '}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-400 bg-clip-text text-transparent">
            without boundaries
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10 leading-relaxed font-normal">
          Connect, collaborate, and share instantly with crystal-clear real-time communication.
          Discretion, fluid design, and speed unified in one modern app.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto px-8 font-semibold shadow-lg shadow-emerald-600/30" icon={ArrowRight}>
              Start Chatting Now
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 font-medium">
              Sign In to Your Account
            </Button>
          </Link>
        </div>

        {/* Realistic Chat Mockup Preview */}
        <div className="w-full max-w-4xl rounded-2xl p-2 sm:p-4 bg-gradient-to-b from-emerald-500/10 via-zinc-200/30 to-transparent dark:from-emerald-500/10 dark:via-zinc-800/30 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl backdrop-blur-xl">
          <div className="w-full bg-white dark:bg-zinc-900/90 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner flex flex-col h-[420px] text-left">
            {/* Mock Header */}
            <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    EM
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    Elena Miller
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                      PRO
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-500 font-medium">Active now</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-600 dark:text-zinc-400 font-medium">
                  Encrypted Session
                </span>
              </div>
            </div>

            {/* Mock Message Area */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-zinc-50/30 dark:bg-zinc-950/20">
              <div className="flex items-start gap-2.5 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                  EM
                </div>
                <div className="bg-white dark:bg-zinc-800 text-[#1F2937] dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700 p-3.5 rounded-2xl rounded-tl-xs text-sm shadow-xs leading-relaxed">
                  Hey! Have you seen the updated design system for NexChat? The dark mode colors feel incredible. 🚀
                  <span className="block text-[10px] text-zinc-400 mt-1">10:42 AM</span>
                </div>
              </div>

              <div className="flex items-end justify-end gap-2 max-w-[80%] ml-auto">
                <div className="bg-[#10B981] text-white p-3.5 rounded-2xl rounded-br-xs text-sm shadow-md shadow-emerald-600/20 leading-relaxed">
                  Yes, just pulled the latest updates! The real-time messaging latency is practically zero. ⚡
                  <span className="block text-[10px] text-emerald-100 mt-1 text-right">10:43 AM • Read</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-bold">
                  EM
                </div>
                <div className="bg-white dark:bg-zinc-800 text-[#1F2937] dark:text-zinc-100 border border-zinc-200/80 dark:border-zinc-700 p-3.5 rounded-2xl rounded-tl-xs text-sm shadow-xs leading-relaxed">
                  Plus the new privacy controls give total peace of mind. Let’s invite the whole team! ✨
                  <span className="block text-[10px] text-zinc-400 mt-1">10:44 AM</span>
                </div>
              </div>

              {/* Typing bubble mockup */}
              <div className="flex items-center gap-1.5 bg-zinc-200/70 dark:bg-zinc-800 px-3 py-2 rounded-2xl w-fit">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              </div>
            </div>

            {/* Mock Composer */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
              <div className="p-2 text-zinc-400">
                <Smile className="w-5 h-5" />
              </div>
              <div className="flex-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl px-4 py-2 text-sm text-zinc-400">
                Write a reply...
              </div>
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                <Send className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Engineered for Modern Communication
          </h2>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Every feature in NexChat is thoughtfully crafted to give you effortless connection and uncompromising privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Real-Time Messaging</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Instant delivery powered by WebSockets. Live typing indicators, message status receipts, and seamless media sync.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Username Discovery</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Connect with contacts without ever sharing your phone number. Search by unique @username handles securely.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Granular Privacy</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Customize who can see your online status, last seen timestamp, read receipts, and effortlessly manage blocked lists.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500/50 transition-all hover:shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-5">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold mb-2">Group Conversations</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Create vibrant community and team spaces with multiple participants, admin controls, and rich media sharing.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section className="py-20 px-6 bg-zinc-50/50 dark:bg-zinc-900/40 border-y border-zinc-200/60 dark:border-zinc-800/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero Knowledge Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Your conversations are private. As they should be.
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              In an age of constant surveillance, NexChat is built with privacy by default. We do not sell your personal data, track your browsing across the web, or read your messages.
            </p>
            <div className="space-y-3 pt-2">
              {[
                'Cookie-based secure session verification',
                'No phone number requirement for registration',
                'One-click contact blocking and dispute reporting',
                'Toggleable read receipts and activity indicators',
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="md:w-1/2 flex justify-center">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80 rounded-3xl bg-gradient-to-tr from-emerald-600/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center p-8 backdrop-blur-md">
              <div className="w-40 h-40 rounded-full bg-emerald-600/10 dark:bg-emerald-500/20 flex items-center justify-center ring-8 ring-emerald-500/10 animate-pulse">
                <ShieldCheck className="w-20 h-20 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6">
          Ready to experience the future of chat?
        </h2>
        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Create an account in seconds. Discover friends, organize groups, and enjoy uninterrupted conversations across any device.
        </p>
        <Link href="/register">
          <Button size="lg" className="px-10 py-3.5 text-base font-bold shadow-xl shadow-emerald-600/30" icon={ArrowRight}>
            Create Free Account
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 py-10 px-6 bg-white dark:bg-[#0c0c11]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <MessageCircleCode className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">NexChat</span>
            <span>&copy; 2026 NexChat Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
              Register
            </Link>
            <span className="hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer">
              Privacy Policy
            </span>
            <span className="hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer">
              Terms of Service
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
